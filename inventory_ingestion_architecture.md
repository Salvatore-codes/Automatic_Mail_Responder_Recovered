# Pluggable Inventory Connection Architecture

This document proposes a pluggable adapter architecture to allow the Trofeo pipeline to fetch, match, and update inventory/SKU catalog data from any source—including CSV, Excel files, relational databases (PostgreSQL, MySQL, SQLite, SQL Server), and external ERP systems (like Odoo).

---

## 1. Architectural Overview

Currently, the `Catalog` class is tightly coupled to reading and writing a local CSV file on disk. To support multiple sources dynamically per company vertical/tenant, we can transition to an **Adapter Pattern**:

```mermaid
classDiagram
    direction TB
    class Catalog {
        -connector: BaseInventoryConnector
        -synonyms: dict
        -tfidf: SimpleTFIDF
        +load_catalog()
        +match_fuzzy(query)
        +match_vector(query)
        +update_sku_properties(sku_id, stock, price)
    }

    class BaseInventoryConnector {
        <<interface>>
        +fetch_all_skus() List[dict]
        +get_sku_by_id(sku_id) dict
        +update_sku(sku_id, stock, price) bool
    }

    class CSVConnector {
        -csv_path: str
        +fetch_all_skus()
        +get_sku_by_id(sku_id)
        +update_sku(sku_id, stock, price)
    }

    class ExcelConnector {
        -file_path: str
        -sheet_name: str
        +fetch_all_skus()
        +get_sku_by_id(sku_id)
        +update_sku(sku_id, stock, price)
    }

    class SQLDatabaseConnector {
        -connection_uri: str
        -table_name: str
        +fetch_all_skus()
        +get_sku_by_id(sku_id)
        +update_sku(sku_id, stock, price)
    }

    class ERPConnector {
        -api_url: str
        -credentials: dict
        +fetch_all_skus()
        +get_sku_by_id(sku_id)
        +update_sku(sku_id, stock, price)
    }

    Catalog --> BaseInventoryConnector : uses
    BaseInventoryConnector <|-- CSVConnector : implements
    BaseInventoryConnector <|-- ExcelConnector : implements
    BaseInventoryConnector <|-- SQLDatabaseConnector : implements
    BaseInventoryConnector <|-- ERPConnector : implements
```

---

## 2. Base Adapter Interface (`BaseInventoryConnector`)

We can define a base interface in `src/connectors/base.py` that all inventory sources must implement:

```python
from abc import ABC, abstractmethod
from typing import List, Dict, Optional

class BaseInventoryConnector(ABC):
    
    @abstractmethod
    def fetch_all_skus(self) -> List[Dict]:
        """
        Fetch the entire catalog of SKUs.
        Returned dicts must follow the standard SKU keys:
        ['sku_id', 'sku_name', 'description', 'price', 'stock', 'category']
        """
        pass
        
    @abstractmethod
    def get_sku_by_id(self, sku_id: str) -> Optional[Dict]:
        """Fetch a single SKU by its unique identifier."""
        pass
        
    @abstractmethod
    def update_sku(self, sku_id: str, stock: Optional[int] = None, price: Optional[float] = None) -> bool:
        """
        Update the stock level and/or unit price in the external source.
        Returns True if successful, False otherwise.
        """
        pass
```

---

## 3. Connector Implementations

### A. Excel Connector (xlsx / xls)
Uses `pandas` or `openpyxl` to read and write excel spreadsheets:
```python
import pandas as pd

class ExcelConnector(BaseInventoryConnector):
    def __init__(self, file_path: str, sheet_name: str = "Sheet1"):
        self.file_path = file_path
        self.sheet_name = sheet_name

    def fetch_all_skus(self) -> List[Dict]:
        df = pd.read_excel(self.file_path, sheet_name=self.sheet_name)
        # Normalize headers and return as list of dicts
        return df.to_dict(orient="records")

    def get_sku_by_id(self, sku_id: str) -> Optional[Dict]:
        df = pd.read_excel(self.file_path, sheet_name=self.sheet_name)
        match = df[df['sku_id'].astype(str).str.upper() == sku_id.upper()]
        return match.to_dict(orient="records")[0] if not match.empty else None

    def update_sku(self, sku_id: str, stock: Optional[int] = None, price: Optional[float] = None) -> bool:
        df = pd.read_excel(self.file_path, sheet_name=self.sheet_name)
        idx = df[df['sku_id'].astype(str).str.upper() == sku_id.upper()].index
        if idx.empty:
            return False
        if stock is not None:
            df.at[idx[0], 'stock'] = stock
        if price is not None:
            df.at[idx[0], 'price'] = price
        df.to_excel(self.file_path, sheet_name=self.sheet_name, index=False)
        return True
```

### B. Relational Database Connector (SQLAlchemy)
Connects to PostgreSQL, MySQL, SQLite, or Oracle using SQLAlchemy models:
```python
from sqlalchemy import create_engine, text

class SQLDatabaseConnector(BaseInventoryConnector):
    def __init__(self, connection_uri: str, table_name: str = "inventory"):
        self.engine = create_engine(connection_uri)
        self.table = table_name

    def fetch_all_skus(self) -> List[Dict]:
        with self.engine.connect() as conn:
            result = conn.execute(text(f"SELECT sku_id, sku_name, description, price, stock, category FROM {self.table}"))
            return [dict(row) for row in result.mappings()]

    def get_sku_by_id(self, sku_id: str) -> Optional[Dict]:
        with self.engine.connect() as conn:
            query = text(f"SELECT sku_id, sku_name, description, price, stock, category FROM {self.table} WHERE UPPER(sku_id) = :sku_id")
            result = conn.execute(query, {"sku_id": sku_id.upper()}).mappings().first()
            return dict(result) if result else None

    def update_sku(self, sku_id: str, stock: Optional[int] = None, price: Optional[float] = None) -> bool:
        updates = []
        params = {"sku_id": sku_id.upper()}
        if stock is not None:
            updates.append("stock = :stock")
            params["stock"] = stock
        if price is not None:
            updates.append("price = :price")
            params["price"] = price
        
        if not updates:
            return True
            
        with self.engine.begin() as conn:
            query = text(f"UPDATE {self.table} SET {', '.join(updates)} WHERE UPPER(sku_id) = :sku_id")
            result = conn.execute(query, params)
            return result.rowcount > 0
```

---

## 4. Tenant Profile Database Integration

Currently, the `vertical_profiles` SQLite table has a text field `catalog_path` (e.g. `'data/sku_catalog.csv'`). We can extend the schema to support this pluggable system:

### Schema Update
```sql
ALTER TABLE vertical_profiles ADD COLUMN catalog_type TEXT DEFAULT 'csv'; -- 'csv', 'excel', 'sql', 'erp'
ALTER TABLE vertical_profiles ADD COLUMN catalog_connection_string TEXT;  -- connection URI, file path, or API URL
ALTER TABLE vertical_profiles ADD COLUMN catalog_extra_config TEXT;       -- JSON string containing sheet_name, tables, api_keys, etc.
```

### Factory Function for Instantiation
In `src/tenants.py`, the `Catalog` instance would be built dynamically based on these fields:

```python
def get_connector_for_vertical(vertical_config: dict) -> BaseInventoryConnector:
    ctype = vertical_config.get("catalog_type", "csv")
    conn_str = vertical_config.get("catalog_connection_string", vertical_config.get("catalog_path"))
    extra = json.loads(vertical_config.get("catalog_extra_config") or "{}")

    if ctype == "excel":
        return ExcelConnector(conn_str, sheet_name=extra.get("sheet_name", "Sheet1"))
    elif ctype == "sql":
        return SQLDatabaseConnector(conn_str, table_name=extra.get("table_name", "inventory"))
    elif ctype == "erp":
        return ERPConnector(conn_str, credentials=extra.get("credentials"))
    else:
        # Fallback to local CSV
        return CSVConnector(conn_str)
```

---

## 5. UI Settings Screen Integration

In the **AI Onboarding** or **Vertical Settings** tab, we can add a configuration panel for the database connection:

1. **Source Type Dropdown:** (CSV File, Excel Spreadsheet, SQL Database, ERP Sync).
2. **Dynamic Configuration Fields:**
   * If **CSV/Excel:** Render File Upload or file path input.
   * If **SQL Database:** Render Connection URI (e.g. `postgresql://user:pass@host/db`) and Target Table inputs.
   * If **ERP Sync:** Render API Endpoint and API Token inputs.
3. **Test Connection Button:** Performs a dry-run `fetch_all_skus()` to verify settings before saving.
