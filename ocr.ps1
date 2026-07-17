# ocr.ps1 - Local OCR script using Windows built-in capabilities
# Usage: powershell -File ocr.ps1 <image_path>
param(
    [Parameter(Mandatory=$true)]
    [string]$ImagePath
)

if (-not (Test-Path $ImagePath)) {
    Write-Error "Image file not found: $ImagePath"
    exit 1
}

try {
    Add-Type -AssemblyName System.Drawing
    Add-Type -AssemblyName System.Windows.Forms

    # Load the image
    $bitmap = [System.Drawing.Bitmap]::new($ImagePath)

    # Use Windows OCR if available (.NET 5+ / Windows 10+)
    $ocrAvailable = $false
    try {
        Add-Type -AssemblyName Windows.Media.Ocr
        $ocrAvailable = $true
    } catch {
        $ocrAvailable = $false
    }

    if ($ocrAvailable) {
        # Windows Media OCR path
        $stream = [System.IO.MemoryStream]::new()
        $bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
        $stream.Position = 0

        $randomAccessStream = [Windows.Storage.Streams.InMemoryRandomAccessStream]::new()
        $writer = [Windows.Storage.Streams.DataWriter]::new($randomAccessStream)
        $bytes = $stream.ToArray()
        $writer.WriteBytes($bytes)
        $flushTask = $writer.StoreAsync()
        while (-not $flushTask.IsCompleted) { Start-Sleep -Milliseconds 10 }

        $randomAccessStream.Seek(0)
        $decoder = [Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($randomAccessStream).GetResults()
        $softwareBitmap = $decoder.GetSoftwareBitmapAsync().GetResults()

        $ocrEngine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
        if ($null -eq $ocrEngine) {
            $ocrEngine = [Windows.Media.Ocr.OcrEngine]::AvailableRecognizerLanguages | 
                         Select-Object -First 1 | 
                         ForEach-Object { [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($_) }
        }

        if ($null -ne $ocrEngine) {
            $result = $ocrEngine.RecognizeAsync($softwareBitmap).GetResults()
            Write-Output $result.Text
            exit 0
        }
    }

    # Fallback: Use Tesseract if available
    $tesseract = Get-Command "tesseract" -ErrorAction SilentlyContinue
    if ($tesseract) {
        $outFile = [System.IO.Path]::GetTempFileName()
        & tesseract $ImagePath $outFile --psm 6 quiet 2>$null
        if (Test-Path "$outFile.txt") {
            $text = Get-Content "$outFile.txt" -Raw
            Remove-Item "$outFile.txt" -Force -ErrorAction SilentlyContinue
            Remove-Item $outFile -Force -ErrorAction SilentlyContinue
            Write-Output $text
            exit 0
        }
    }

    Write-Warning "No OCR engine available (Windows OCR or Tesseract)."
    exit 1

} catch {
    Write-Error "OCR failed: $_"
    exit 1
} finally {
    if ($null -ne $bitmap) { $bitmap.Dispose() }
}
