# Pravi (પ્રવિ) — Infrastructure Asset Lifecycle Management Architecture

## 1. High-Level System Architecture

```mermaid
graph TB
    subgraph Client_Layer ["Client Tier (React 19 + Vite SPA)"]
        UI["Modern Institutional UI<br/>(Inter Fonts, Vanilla CSS Tokens)"]
        Nav["Router & State<br/>(React Router v7 + AuthContext)"]
        Charts["Analytics Suite<br/>(Custom SVG Curves, Donut & Bar Visualizations)"]
        Geo["Map & GIS Engine<br/>(Leaflet Interactive Circle & Camp Visualizer)"]
    end

    subgraph CDN_Gateway ["Cloud Delivery & Edge Routing"]
        Vercel["Vercel Edge Network<br/>(https://dhruvik-pravi.vercel.app)"]
        Proxy["SPA Rewrite Engine<br/>(/api/* ➔ Backend Proxy)"]
    end

    subgraph Backend_Layer ["Application Tier (Node.js & Express REST API)"]
        App["Express 4 App Engine<br/>(CORS, CookieParser, Morgan)"]
        AuthMiddleware["Security & Auth Middleware<br/>(JWT Verification + RBAC Guard)"]
        
        subgraph Controllers ["Controllers"]
            C_Auth["Auth Controller"]
            C_Asset["Asset Controller"]
            C_Maint["Maintenance Controller"]
            C_Trans["Transfer Controller"]
            C_Dash["Dashboard & Analytics"]
            C_User["User & Personnel"]
        end

        subgraph Services ["Service Domain Logic"]
            S_Asset["Asset Service (Lifecycle & Depreciation)"]
            S_Maint["Maintenance Service (Work Orders & Parts)"]
            S_Trans["Transfer Service (Gate Passes & Custody)"]
            S_Dash["Analytics Aggregation Engine"]
            S_Audit["Audit Trail & AssetEvent Logger"]
        end
    end

    subgraph Data_Layer ["Data Tier (MongoDB)"]
        Mongoose["Mongoose 8 ODM"]
        subgraph Collections ["MongoDB Collections"]
            Col_Users[("Users")]
            Col_Assets[("Assets")]
            Col_Locations[("Locations")]
            Col_Maint[("Maintenance")]
            Col_Transfers[("Transfers")]
            Col_Events[("AssetEvents (Immutable Audit)")]
        end
    end

    UI --> Nav
    Nav --> Vercel
    Vercel --> Proxy
    Proxy --> App
    App --> AuthMiddleware
    AuthMiddleware --> Controllers
    Controllers --> Services
    Services --> Mongoose
    Mongoose --> Collections
```

---

## 2. Role-Based Access Control (RBAC) Architecture

```mermaid
graph LR
    subgraph Roles ["Institutional Roles"]
        R_Admin["🛡️ Super Admin<br/>(State Secretariat)"]
        R_Manager["👷 Executive Engr<br/>(Roads & Highways Division)"]
        R_Tech["🔧 Technician<br/>(Mechanical Workshop Depot)"]
        R_Employee["👤 Field Custodian<br/>(Field QC / Project Sites)"]
    end

    subgraph Capabilities ["System Permissions Matrix"]
        P_Full["Master System & User Governance"]
        P_Assets["Asset CRUD, Gate Pass Approval & Dispatch"]
        P_Work["Work Order Execution, Parts & Cost Logging"]
        P_Report["Issue Reporting & Status Inquiries"]
        P_Audit["Immutable Audit Log Review"]
    end

    R_Admin --> P_Full
    R_Admin --> P_Assets
    R_Admin --> P_Work
    R_Admin --> P_Audit

    R_Manager --> P_Assets
    R_Manager --> P_Work
    R_Manager --> P_Audit

    R_Tech --> P_Work
    R_Tech --> P_Report

    R_Employee --> P_Report
```

---

## 3. Work Order & Maintenance Lifecycle Flow

```mermaid
stateDiagram-v2
    [*] --> OPEN: Field Custodian / Operator Reports Breakdown
    OPEN --> ASSIGNED: Executive Engr assigns Field Technician
    ASSIGNED --> IN_PROGRESS: Technician begins on-site inspection
    
    IN_PROGRESS --> WAITING_FOR_PARTS: Spare Parts Ordered (e.g. Hydraulic Seal Kit)
    WAITING_FOR_PARTS --> IN_PROGRESS: Parts Delivered to Depot & Installed
    
    IN_PROGRESS --> RESOLVED: Technician marks work completed & logs repair cost
    RESOLVED --> CLOSED: Executive Engr / Super Admin verifies & signs off
    CLOSED --> [*]: Asset returned to full operational service
```

---

## 4. Gate Pass & Inter-Site Custody Transfer Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Officer as Executive Engr (Sender)
    participant API as Pravi API Gateway
    participant TransServ as Transfer Service
    participant DB as MongoDB
    actor Tech as Technician / Logistics Driver
    actor RecOfficer as Executive Engr (Receiver)

    Officer->>API: POST /api/transfers (Request transfer: Rajkot ➔ NH-48 Camp)
    API->>TransServ: Validate asset availability (status = IN_USE)
    TransServ->>DB: Save Transfer (Status: REQUESTED)
    
    Officer->>API: PUT /api/transfers/:id/approve (Approval sign-off)
    API->>TransServ: Update Status: APPROVED
    
    Officer->>API: PUT /api/transfers/:id/dispatch (Carrier & Gate Pass generation)
    API->>TransServ: Asset status ➔ IN_TRANSIT, Transfer ➔ DISPATCHED
    TransServ->>DB: Append immutable AssetEvent audit trail
    
    Tech->>RecOfficer: Physical transport via low-bed trailer
    RecOfficer->>API: PUT /api/transfers/:id/receive (Physical verification & intake)
    API->>TransServ: Asset location ➔ NH-48 Camp, Transfer ➔ COMPLETED
    TransServ->>DB: Update Asset.currentLocation & create ASSIGNMENT event
```
