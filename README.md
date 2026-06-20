# Lumen - Conversational Document RAG Assistant
Documentation detailing project technologies, architecture, running procedures, and technical implementation.

---

## 🛠️ Technology Stack

Lumen is split into a **modular static frontend** dashboard and an **offline/online Python LangChain RAG pipeline**.

### Frontend (User Interface)
* **Core Layout**: Standard HTML5 skeleton grid structure containing three interactive panels:
  * **Left Sidebar**: Search bar and recent chat histories.
  * **Central Chat Log**: Interactive chat feed, context badges, and drag-and-drop document indexer.
  * **Right Sidebar**: Reusable Calendar filtering widget or a high-precision Mechanical Stopwatch.
* **Styling**: Modern Vanilla CSS variables, custom typography (Outfit and Inter Google Fonts), and responsive layouts.
* **Transitions & Animations**: 
  * **Anime.js**: Spawns floating drifting geometric shapes and runs modal slide-ins.
  * **2D Canvas ripples**: Simulates water displacement physics on background hover trails and mouse clicks.
  * **Scroll-driven SVG globe**: Draws/spins a green wireframe sphere in the background during scrolling.
* **State & Connection**: Native ES6 Module imports, local storage preference bindings, and asynchronous browser `Fetch` clients.

### Backend (LangChain RAG)
* **Framework**: Python 3.x with LangChain (`langchain-community`, `langchain-openai`).
* **Vector Store**: **Chroma DB** (in-memory persistent store).
* **AI Embeddings & Model**: OpenAI API (`text-embedding-3-small` / `gpt-3.5-turbo`).
* **Web Server Bridge**: Python Flask with CORS support to act as a bridge for REST APIs.

---

## 📂 Key File Structure

Here are the primary modules of the workspace:

* **Frontend Codebase**:
  * [index.html](file:///E:/Project%201/index.html) - Main layout structure.
  * [src/main.js](file:///E:/Project%201/src/main.js) - Application entry bootstrap point.
  * [src/pages/DashboardPage.js](file:///E:/Project%201/src/pages/DashboardPage.js) - Handles subcomponent orchestration.
  * [src/services/api.js](file:///E:/Project%201/src/services/api.js) - Sends queries and file uploads to the backend.
  * [src/utils/constants.js](file:///E:/Project%201/src/utils/constants.js) - API endpoints and text templates.
  * [src/animations/animeBackground.js](file:///E:/Project%201/src/animations/animeBackground.js) - Manages the scroll-driven background globe and drift animations.
  * [src/animations/rippleEffect.js](file:///E:/Project%201/src/animations/rippleEffect.js) - Canvas water displacement physics simulation.

* **Backend RAG Codebase**:
  * [langchain_rag/app.py](file:///E:/Project%201/langchain_rag/app.py) - Flask web API server bridging the frontend to Chroma DB.
  * [langchain_rag/create_database.py](file:///E:/Project%201/langchain_rag/create_database.py) - Script to chunk documents and build the Chroma DB.
  * [langchain_rag/query_data.py](file:///E:/Project%201/langchain_rag/query_data.py) - Command-line script to search Chroma and invoke OpenAI models.
  * [langchain_rag/requirements.txt](file:///E:/Project%201/langchain_rag/requirements.txt) - List of Python requirements.

---

## 🎨 Visual Themes & UI Modes

Lumen implements two highly curated visual modes, controlled in the settings panel (gear icon, top-right):

| Feature | Glassy Frost (Default Theme) | Mechanical Gears (Midnight Theme) |
| :--- | :--- | :--- |
| **Aesthetic** | Frosted glass card overlays, vibrant gradients | Light-beige, high-contrast, transparent cogs style |
| **Card Blurs** | Heavy glassmorphism (`backdrop-filter: blur(10px)`) | Completely clear (`backdrop-filter: none`) |
| **Backdrop** | Refracting aurora/forest images under water ripples | Drifting gold shapes, dark charcoal outline strokes |
| **Right Widget**| Monthly calendar highlighting conversation dates | Animated Mechanical Timer/Stopwatch with sweeps |
| **Background Widget** | Canvas water ripple trails | Scroll-Driven glowing green Wireframe Globe |

---

## 🚀 How to Run the Project

Follow these steps to run both the frontend dashboard and the backend API server.

### Step 1: Run the Frontend
1. Open a terminal inside the project root `E:\Project 1`.
2. Start a simple static file server:
   ```bash
   python -m http.server 8080
   ```
3. Open your web browser and navigate to **`http://localhost:8080`**.

### Step 2: Configure Backend Environment
1. Install C++ build tools (required for compiling Chroma DB on Windows):
   * Follow the [VS Build Tools installation guide](https://github.com/bycloudai/InstallVSBuildToolsWindows) if you do not have MS C++ compiler environment set up.
2. Open a separate terminal and navigate to the `langchain_rag` folder:
   ```bash
   cd "E:\Project 1\langchain_rag"
   ```
3. Create a virtual environment and activate it (recommended):
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Mac/Linux:
   source venv/bin/activate
   ```
4. Install all Python dependencies:
   ```bash
   pip install -r requirements.txt
   pip install "unstructured[md]" Flask Flask-CORS
   ```
5. Create a file named `.env` in the `langchain_rag` directory and add your OpenAI key:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

### Step 3: Run the Backend RAG Server
1. With your virtual environment active in the `langchain_rag` directory, run the Flask bridge server:
   ```bash
   python app.py
   ```
2. The server will start on **`http://localhost:5000`**. 
3. *Now, whenever you upload a document or ask a question in the frontend, the UI will query the Python LangChain server directly instead of falling back to mock responses!*

---

## 💡 Implementation Details & Customization

### Adding custom documents offline
If you have documents you want to ingest offline instead of uploading them via the dashboard:
1. Place your `.md` files inside the `langchain_rag/data/books/` directory.
2. Rebuild the database index:
   ```bash
   python create_database.py
   ```

### Tuning RAG Parameters
* **Text Chunking**: You can adjust segment lengths and overlaps in [create_database.py](file:///E:/Project%201/langchain_rag/create_database.py#L40-L46) inside `split_text()` (currently splits text into 300-character chunks with a 100-character overlap).
* **Similarity Threshold**: In [app.py: L46](file:///E:/Project%201/langchain_rag/app.py#L46), similarity matching is filtered at a `0.65` relevance threshold. Adjust this value to make results stricter or looser.



