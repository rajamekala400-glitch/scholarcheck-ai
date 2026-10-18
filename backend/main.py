
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re

app = FastAPI(title="ScholarCheck AI API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class CheckRequest(BaseModel):
    text: str = Field(min_length=1, max_length=50000)

REFERENCE_DOCUMENTS = [
    {
        "id": "sample-1",
        "title": "Sample Academic Reference 1",
        "text": (
            "Artificial intelligence helps researchers analyze large "
            "amounts of data and discover useful patterns."
        ),
    },
    {
        "id": "sample-2",
        "title": "Sample Academic Reference 2",
        "text": (
            "Machine learning systems can support information retrieval "
            "and the analysis of research documents."
        ),
    },
]

def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower()).strip()

def split_sentences(text: str):
    return [
        sentence.strip()
        for sentence in re.split(r"(?<=[.!?])\s+", text.strip())
        if sentence.strip()
    ]

@app.get("/")
def home():
    return {"message": "ScholarCheck AI API is running", "version": "0.2.0"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/api/check")
def check_text(request: CheckRequest):
    submitted_text = request.text.strip()

    if not submitted_text:
        return {"error": "Please submit non-empty text."}

    normalized_text = normalize(submitted_text)
    documents = [
        {"id": "submitted", "title": "Submitted Text", "text": normalized_text},
        *[
            {**doc, "text": normalize(doc["text"])}
            for doc in REFERENCE_DOCUMENTS
        ],
    ]

    corpus = [doc["text"] for doc in documents]
    vectorizer = TfidfVectorizer(ngram_range=(1, 2))
    matrix = vectorizer.fit_transform(corpus)

    matches = []

    for index, document in enumerate(documents[1:], start=1):
        score = float(
            cosine_similarity(matrix[0:1], matrix[index:index + 1])[0][0]
        )

        reference_sentences = split_sentences(document["text"])
        submitted_sentences = split_sentences(normalized_text)
        matched_passages = []

        if reference_sentences and submitted_sentences:
            sentence_corpus = submitted_sentences + reference_sentences
            sentence_matrix = vectorizer.fit_transform(sentence_corpus)
            submitted_count = len(submitted_sentences)

            for sentence_index, sentence in enumerate(submitted_sentences):
                best_score = 0.0
                best_reference = ""

                for reference_index in range(
                    submitted_count, len(sentence_corpus)
                ):
                    sentence_score = float(
                        cosine_similarity(
                            sentence_matrix[sentence_index:sentence_index + 1],
                            sentence_matrix[reference_index:reference_index + 1],
                        )[0][0]
                    )

                    if sentence_score > best_score:
                        best_score = sentence_score
                        best_reference = reference_sentences[
                            reference_index - submitted_count
                        ]

                if best_score >= 0.25:
                    matched_passages.append({
                        "submitted_sentence": sentence,
                        "reference_sentence": best_reference,
                        "similarity_percent": round(best_score * 100, 2),
                    })

        matches.append({
            "source_id": document["id"],
            "source_title": document["title"],
            "similarity_percent": round(score * 100, 2),
            "matched_passages": matched_passages,
        })

    matches.sort(
        key=lambda item: item["similarity_percent"],
        reverse=True,
    )

    return {
        "word_count": len(submitted_text.split()),
        "reference_count": len(REFERENCE_DOCUMENTS),
        "matches": matches,
        "notice": (
            "Experimental similarity against two built-in sample references. "
            "Sentence matches are approximate and are not a plagiarism verdict."
        ),
    }
