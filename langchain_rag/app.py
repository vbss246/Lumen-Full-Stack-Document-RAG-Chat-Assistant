from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import shutil
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv

# Load env variables (expects OPENAI_API_KEY to be set)
load_dotenv()

app = Flask(__name__)
# Enable CORS so that the frontend running on localhost:8080 can call localhost:5000
CORS(app)

# Ensure absolute paths relative to app.py location
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CHROMA_PATH = os.path.join(BASE_DIR, "chroma")
DATA_PATH = os.path.join(BASE_DIR, "data", "books")

PROMPT_TEMPLATE = """
Answer the question based only on the following context:

{context}

---

Answer the question based on the above context: {question}
"""

@app.route('/api/query', methods=['POST'])
def query_rag():
    data = request.json or {}
    query_text = data.get('query')
    if not query_text:
        return jsonify({"error": "Query text is required"}), 400

    # Ensure OpenAI Key is present
    if not os.getenv("OPENAI_API_KEY"):
        return jsonify({
            "response": "Error: OpenAI API Key (OPENAI_API_KEY) is not set in the backend environment variables.",
            "sources": []
        }), 500

    try:
        # Prepare the DB.
        embedding_function = OpenAIEmbeddings()
        db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embedding_function)

        # Search the DB.
        results = db.similarity_search_with_relevance_scores(query_text, k=3)
        if len(results) == 0 or results[0][1] < 0.65:
            return jsonify({
                "response": "Based on the documents provided, I couldn't find a direct match with high confidence.",
                "sources": []
            })

        # Compile matching document contents
        context_text = "\n\n---\n\n".join([doc.page_content for doc, _score in results])
        prompt_template = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)
        prompt = prompt_template.format(context=context_text, question=query_text)

        # Run AI predict
        model = ChatOpenAI()
        response_text = model.predict(prompt)

        # Extract source names
        sources = list(set([doc.metadata.get("source", "unknown") for doc, _score in results]))
        clean_sources = [os.path.basename(s) for s in sources]

        return jsonify({
            "response": response_text,
            "sources": clean_sources
        })
    except Exception as e:
        print(f"Error querying RAG DB: {e}")
        return jsonify({
            "response": f"An error occurred while querying the RAG pipeline: {str(e)}",
            "sources": []
        }), 500

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file attachment found"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    try:
        # Ensure data folder exists
        os.makedirs(DATA_PATH, exist_ok=True)
        
        # Save file locally
        file_path = os.path.join(DATA_PATH, file.filename)
        file.save(file_path)
        
        # Trigger index rebuild to ingest the newly uploaded file
        from create_database import generate_data_store
        
        # Override DATA_PATH inside create_database.py if loaded in-memory
        generate_data_store()
        
        return jsonify({
            "success": True,
            "name": file.filename,
            "size": os.path.getsize(file_path),
            "type": file.filename.split('.')[-1].upper()
        })
    except Exception as e:
        print(f"Error uploading/indexing file: {e}")
        return jsonify({"error": f"Failed to upload and index document: {str(e)}"}), 500

if __name__ == '__main__':
    # Run on Port 5000 to match the client constants definition
    print(f"Starting Lumen RAG HTTP API server on port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=True)
