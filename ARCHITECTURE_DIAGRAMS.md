# AcademiGuard - System Architecture Diagrams

## Diagram 1: Complete System Architecture

```mermaid
graph TB
    subgraph Frontend["🎨 Frontend Layer"]
        UI["React UI Interface"]
        Chat["Chat Component"]
        Settings["Settings Panel"]
        Nav["Navigation System"]
    end

    subgraph Browser["Browser Layer"]
        LS["Local Storage"]
        Cache["Session Cache"]
    end

    subgraph Backend["⚙️ Backend Layer - FastAPI"]
        API["API Router"]
        ModeSelector["Response Mode Selector"]
        UserSvc["User Service"]
        ChatSvc["Chat Service"]
    end

    subgraph MLServices["🤖 ML & RAG Layer"]
        RAGModule["RAG Module"]
        WebSearch["Web Search Service"]
        VectorDB["Vector Store (ChromaDB)"]
        LLM["LLM Engine (Ollama)"]
        Embeddings["Embeddings (Sent-Trans)"]
    end

    subgraph DataLayer["💾 Data Layer"]
        Firestore["Firestore (Users, Settings)"]
        Firebase["Firebase Auth"]
        PDFs["PDF Repository"]
    end

    subgraph ExternalServices["🌐 External Services"]
        GoogleAPI["Google Custom Search"]
        FCM["Firebase Cloud Messaging"]
    end

    UI --> Chat
    UI --> Settings
    UI --> Nav
    Chat --> API
    Settings --> UserSvc
    LS --> Browser
    Cache --> Browser

    API --> ModeSelector
    ModeSelector --> RAGModule
    ModeSelector --> WebSearch
    ModeSelector --> LLM

    RAGModule --> VectorDB
    RAGModule --> Embeddings
    VectorDB --> PDFs

    WebSearch --> GoogleAPI

    RAGModule --> LLM
    WebSearch --> LLM

    UserSvc --> Firestore
    UserSvc --> Firebase

    LLM --> Chat
    Chat --> FCM
    FCM --> UI

    style Frontend fill:#e1f5ff
    style Backend fill:#f3e5f5
    style MLServices fill:#e8f5e9
    style DataLayer fill:#fff3e0
    style ExternalServices fill:#fce4ec
```

## Diagram 2: Hybrid Retrieval Decision Flow

```mermaid
flowchart TD
    Start["👤 User Submits Question"] --> Mode{"Check Response Mode"}

    Mode -->|Document Mode| RAGOnly["🔒 RAG-Only Path"]
    Mode -->|Web Mode| WebOnly["🌐 Web-Only Path"]
    Mode -->|Hybrid Mode| Hybrid["🤖 Hybrid Path"]

    RAGOnly --> RQuery["Query Vector DB"]
    RQuery --> RDist["Get Similarity Distance"]
    RDist --> RCheck{"Distance ≤ 1.2?"}
    RCheck -->|Yes| UsePDF["✅ Use PDF Content"]
    RCheck -->|No| RAGFail["⚠️ No Good Match"]

    WebOnly --> WSearch["🔍 Google Search"]
    WSearch --> WResults["Extract Top 3 Results"]

    Hybrid --> HQuery["Query Vector DB"]
    HQuery --> HDist["Get Similarity Distance"]
    HDist --> HCheck{"Distance ≤ 1.2?"}
    HCheck -->|Yes| UseHybridPDF["✅ Use PDF Content"]
    HCheck -->|No| FallbackWeb["🔄 Fallback to Web"]
    FallbackWeb --> WSearch

    WResults --> ProcessWeb["📄 Process Web Results"]
    ProcessWeb --> WebSynth["Synthesize Information"]

    RAGFail --> WebFallback["Try Global Fallback"]
    WebFallback --> WebSynth

    UsePDF --> Personalize["👤 Personalize Response"]
    UseHybridPDF --> Personalize
    WebSynth --> Personalize

    Personalize --> LLMGen["🧠 LLM Generation"]
    LLMGen --> ValidateResp["✔️ Validate Response"]
    ValidateResp --> ReturnResp["📤 Return to User"]
    ReturnResp --> LogInteraction["📊 Log Interaction"]
    LogInteraction --> TriggerReminders["🔔 Check Reminder Triggers"]
    TriggerReminders --> End["✨ Complete"]

    style Start fill:#e3f2fd
    style Mode fill:#f5f5f5
    style RAGOnly fill:#c8e6c9
    style WebOnly fill:#bbdefb
    style Hybrid fill:#ffe0b2
    style End fill:#c8e6c9
```

## Diagram 3: Personalization Framework

```mermaid
graph LR
    subgraph UserProfile["👤 User Profile"]
        Academic["Academic Info"]
        History["Chat History"]
        Preferences["User Preferences"]
        Performance["Academic Performance"]
    end

    subgraph Personalization["🎯 Personalization Engine"]
        ContextBuilder["Context Builder"]
        PromptEngineer["Prompt Engineer"]
        ResponseShaper["Response Shaper"]
    end

    subgraph RAGProcess["📚 RAG Process"]
        VectorSearch["Vector Search"]
        ReRank["Re-rank Results"]
        ChooseContext["Select Context"]
    end

    subgraph LLMGeneration["🧠 LLM Generation"]
        BasePrompt["Base Prompt"]
        PersonalizedPrompt["+ Personalization"]
        FinalPrompt["Final Prompt"]
        Generate["Generate Response"]
    end

    subgraph Output["📤 Output"]
        Formatted["Format Response"]
        Summarize["Summarize if needed"]
        ReturnResp["Return to User"]
    end

    UserProfile --> ContextBuilder
    ContextBuilder --> PromptEngineer

    RAGProcess --> ChooseContext
    ChooseContext --> PromptEngineer
    PromptEngineer --> ResponseShaper

    BasePrompt --> PersonalizedPrompt
    ResponseShaper --> PersonalizedPrompt
    PersonalizedPrompt --> FinalPrompt
    FinalPrompt --> Generate

    Generate --> Formatted
    Formatted --> Summarize
    Summarize --> ReturnResp

    style UserProfile fill:#e1bee7
    style Personalization fill:#fff9c4
    style RAGProcess fill:#b2dfdb
    style LLMGeneration fill:#ffccbc
    style Output fill:#c5cae9
```

## Diagram 4: Request Processing Pipeline

```mermaid
sequenceDiagram
    participant User as User/Frontend
    participant API as FastAPI Backend
    participant Selector as Mode Selector
    participant RAG as RAG Module
    participant Web as Web Search
    participant LLM as LLM Engine
    participant DB as Vector Store
    participant Cache as Response Cache

    User->>API: POST /chat {question, mode, user_id}
    API->>Cache: Check response cache
    alt Cache Hit
        Cache-->>User: Return cached response
    else Cache Miss
        API->>Selector: Process mode selection
        alt mode == "document"
            Selector->>RAG: Query RAG only
            RAG->>DB: Semantic search
            DB-->>RAG: Return results + distances
            RAG->>RAG: Check similarity threshold
            RAG-->>Selector: Return context
        else mode == "web"
            Selector->>Web: Query web only
            Web-->>Selector: Return web results
        else mode == "hybrid"
            Selector->>RAG: Query RAG
            RAG->>DB: Semantic search
            DB-->>RAG: Return results + distances
            RAG->>RAG: Check if distance ≤ 1.2
            alt Relevant
                RAG-->>Selector: Use PDF context
            else Not Relevant
                Selector->>Web: Fallback to web search
                Web-->>Selector: Return web results
            end
        end
        Selector->>LLM: Generate response with context
        LLM-->>API: Return generated response
        API->>Cache: Store response
        API-->>User: Return response + metadata
    end

    Note over User,LLM: Asynchronous Reminder Trigger
    API->>API: Check reminder conditions
    alt Should trigger reminder
        API->>User: Push notification via FCM
    end
```

## Diagram 5: Data Model & Storage

```mermaid
graph TB
    subgraph Firestore["Firestore Database"]
        Users["users/
        - uid
        - name
        - email
        - program
        - year
        - preferences"]

        Settings["user_settings/
        - responseMode
        - theme
        - notifications
        - language
        - responseLength"]

        ChatHistory["chat_history/
        - timestamp
        - question
        - answer
        - source
        - mode_used
        - user_id"]
    end

    subgraph ChromaDB["ChromaDB Vector Store"]
        Documents["Documents Collection
        - document_id
        - pdf_name
        - embedding
        - text_chunk
        - metadata"]
    end

    subgraph Cache["Local/Session Storage"]
        UserCache["User Cache
        - user_id
        - recent_responses
        - cached_embeddings"]

        ThemeCache["Theme Settings
        - selected_theme
        - colors
        - fonts"]
    end

    Users --> Settings
    Settings --> ChatHistory
    Documents --> ChromaDB
    UserCache --> Cache
    ThemeCache --> Cache

    style Firestore fill:#fff9c4
    style ChromaDB fill:#c8e6c9
    style Cache fill:#ffccbc
```

## Diagram 6: Notification & Reminder System

```mermaid
graph TB
    subgraph Triggers["⏰ Reminder Triggers"]
        ExamCheck["Exam Detection<br/>Event: 7, 2, 1 days before"]
        AttendCheck["Attendance Check<br/>Event: Weekly scan"]
        DeadlineCheck["Assignment Check<br/>Event: 1 week, 3 days, 1 day"]
        PaymentCheck["Payment Detection<br/>Event: Invoice received"]
    end

    subgraph Processing["🔔 Notification Processing"]
        UserPref["Check User<br/>Preferences"]
        Filter["Filter by<br/>Settings"]
        Priority["Calculate<br/>Priority"]
    end

    subgraph Delivery["📤 Delivery Channels"]
        AppNotif["In-App Popup"]
        FBNotif["Firebase Push"]
        Email["Email Alert"]
        Dashboard["Dashboard Widget"]
    end

    subgraph UserInteraction["👤 User Actions"]
        View["View Details"]
        Dismiss["Dismiss"]
        Snooze["Snooze Reminder"]
        Settings["Adjust Settings"]
    end

    Triggers --> Processing
    Processing --> UserPref
    UserPref --> Filter
    Filter --> Priority

    Priority --> Delivery

    Delivery --> AppNotif
    Delivery --> FBNotif
    Delivery --> Email
    Delivery --> Dashboard

    AppNotif --> UserInteraction
    FBNotif --> UserInteraction

    UserInteraction --> Settings
    Settings --> Filter

    style Triggers fill:#ffccbc
    style Processing fill:#b2dfdb
    style Delivery fill:#fff9c4
    style UserInteraction fill:#e1bee7
```

## Diagram 7: Settings Architecture

```mermaid
graph TB
    subgraph UI["Frontend - Settings Panel"]
        ResponseTab["Response Mode Tab"]
        NotifTab["Notifications Tab"]
        AppearanceTab["Appearance Tab"]
        DataTab["Data Management Tab"]
    end

    subgraph State["React State Management"]
        LocalState["Component Local State"]
        GlobalContext["Settings Context"]
        LocalStorage["Local Storage"]
    end

    subgraph API["Backend API Endpoints"]
        GetSettings["/api/settings - GET"]
        SaveSettings["/api/settings - PUT"]
        UpdateMode["/api/settings/mode - POST"]
        ClearHistory["/api/chat/clear - DELETE"]
    end

    subgraph Service["Service Layer"]
        SettingsSvc["Settings Service"]
        ChatSvc["Chat Service"]
        NotifSvc["Notification Service"]
    end

    subgraph DB["Database Layer"]
        Firestore["Firestore"]
        LocalDB["Local Storage"]
    end

    ResponseTab --> GlobalContext
    NotifTab --> GlobalContext
    AppearanceTab --> GlobalContext
    DataTab --> GlobalContext

    GlobalContext --> LocalState
    LocalState --> LocalStorage

    GlobalContext --> API
    API --> Service

    SettingsSvc --> Firestore
    ChatSvc --> Firestore
    NotifSvc --> Firestore

    LocalDB --> LocalStorage

    style UI fill:#e3f2fd
    style State fill:#fff9c4
    style API fill:#f3e5f5
    style Service fill:#c8e6c9
    style DB fill:#ffccbc
```

---

## Key Components Explanation

### 1. **Hybrid Retrieval System**

- Smart decision-making between RAG and web search
- Configurable similarity thresholds
- Automatic fallback mechanisms
- Source attribution and confidence scoring

### 2. **Personalization Engine**

- Multi-factor user profiling
- Adaptive response generation
- Learning from interaction patterns
- Context-aware recommendations

### 3. **Settings Panel**

- Three-mode response configuration
- Customizable notifications
- Theme preferences
- Data management and export

### 4. **Reminder System**

- Proactive alert generation
- Multi-channel delivery
- User preference filtering
- Snooze and customization options

### 5. **Data Architecture**

- Scalable vector database (ChromaDB)
- User profile storage (Firestore)
- Caching mechanisms
- Real-time synchronization
