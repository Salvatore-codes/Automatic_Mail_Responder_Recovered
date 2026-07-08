[void][Windows.Storage.StorageFile, Windows.Storage, ContentType=WindowsRuntime]
[void][Windows.Storage.Streams.IRandomAccessStream, Windows.Storage, ContentType=WindowsRuntime]
[void][Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics, ContentType=WindowsRuntime]
[void][Windows.Graphics.Imaging.SoftwareBitmap, Windows.Graphics, ContentType=WindowsRuntime]
[void][Windows.Media.Ocr.OcrEngine, Windows.Media, ContentType=WindowsRuntime]
[void][Windows.Media.Ocr.OcrResult, Windows.Media, ContentType=WindowsRuntime]
Add-Type -AssemblyName System.Runtime.WindowsRuntime

$imagePath = $args[0]
if (-not $imagePath) {
    Write-Error "Please specify an image path."
    exit 1
}

$imagePath = [System.IO.Path]::GetFullPath($imagePath)
if (-not (Test-Path $imagePath)) {
    Write-Error "File not found: $imagePath"
    exit 1
}

# Helper to await WinRT IAsyncOperation via AsTask reflection
function Await-WinRT {
    param(
        [Parameter(Mandatory=$true)]
        $WinRtTask,
        [Parameter(Mandatory=$true)]
        [Type]$ResultType
    )

    # Get the AsTask methods
    $methods = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' }
    
    # Find the generic method that takes exactly 1 parameter (the async operation)
    $asTaskGeneric = ($methods | Where-Object { $_.IsGenericMethodDefinition -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -like 'IAsyncOperation*' })[0]

    # Convert to a .NET Task
    $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
    $netTask = $asTask.Invoke($null, @($WinRtTask))
    
    # Wait for completion and retrieve the result
    $netTask.Wait(-1) | Out-Null
    return $netTask.Result
}

try {
    # 1. Load the file
    $fileOp = [Windows.Storage.StorageFile]::GetFileFromPathAsync($imagePath)
    $file = Await-WinRT $fileOp ([Windows.Storage.StorageFile])

    # 2. Open the file stream
    $streamOp = $file.OpenAsync([Windows.Storage.FileAccessMode]::Read)
    $stream = Await-WinRT $streamOp ([Windows.Storage.Streams.IRandomAccessStream])

    # 3. Decode the bitmap
    $decoderOp = [Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)
    $decoder = Await-WinRT $decoderOp ([Windows.Graphics.Imaging.BitmapDecoder])

    # 4. Get software bitmap
    $bitmapOp = $decoder.GetSoftwareBitmapAsync()
    $bitmap = Await-WinRT $bitmapOp ([Windows.Graphics.Imaging.SoftwareBitmap])

    # 5. Initialize OCR Engine
    $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
    if ($null -eq $engine) {
        Write-Error "Could not initialize OCR Engine."
        exit 1
    }
    
    # 6. Recognize text
    $recognizeOp = $engine.RecognizeAsync($bitmap)
    $result = Await-WinRT $recognizeOp ([Windows.Media.Ocr.OcrResult])
    
    $words = @()
    foreach ($line in $result.Lines) {
        foreach ($word in $line.Words) {
            $words += [PSCustomObject]@{
                Text = $word.Text
                X = $word.BoundingRect.X
                Y = $word.BoundingRect.Y
                Width = $word.BoundingRect.Width
                Height = $word.BoundingRect.Height
                CenterY = $word.BoundingRect.Y + ($word.BoundingRect.Height / 2)
            }
        }
    }

    if ($words.Count -eq 0) {
        exit 0
    }

    # Group words into visual lines based on vertical overlap
    $visualLines = @()
    foreach ($w in $words) {
        $added = $false
        for ($i = 0; $i -lt $visualLines.Count; $i++) {
            # Check if this word overlaps vertically with this line's average CenterY
            # We use a threshold of 70% of the word's height
            $avgCenterY = $visualLines[$i].AvgCenterY
            $avgHeight = $visualLines[$i].AvgHeight
            $diff = [Math]::Abs($w.CenterY - $avgCenterY)
            if ($diff -lt ($avgHeight * 0.8)) {
                $visualLines[$i].Words += $w
                # Update average CenterY and Height
                $visualLines[$i].AvgCenterY = ($avgCenterY * ($visualLines[$i].Words.Count - 1) + $w.CenterY) / $visualLines[$i].Words.Count
                $visualLines[$i].AvgHeight = ($avgHeight * ($visualLines[$i].Words.Count - 1) + $w.Height) / $visualLines[$i].Words.Count
                $added = $true
                break
            }
        }
        if (-not $added) {
            $visualLines += [PSCustomObject]@{
                Words = @($w)
                AvgCenterY = $w.CenterY
                AvgHeight = $w.Height
            }
        }
    }

    # Sort the lines by their vertical position (AvgCenterY)
    $sortedLines = $visualLines | Sort-Object AvgCenterY

    # For each line, sort words from left to right (X) and print
    foreach ($lineObj in $sortedLines) {
        $sortedWords = $lineObj.Words | Sort-Object X
        $lineText = ($sortedWords | ForEach-Object { $_.Text }) -join " "
        Write-Output $lineText
    }
} catch {
    Write-Error "OCR Processing Failed: $_"
    exit 1
}
