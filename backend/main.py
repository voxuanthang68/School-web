from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

from routers import users, semesters, subjects, grade_types, letter_grades
from routers import assignments, enrollments, classes, grades, reviews, reports

load_dotenv()

app = FastAPI(title="Student Grading System API")

# Configure CORS
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(semesters.router)
app.include_router(subjects.router)
app.include_router(grade_types.router)
app.include_router(letter_grades.router)
app.include_router(assignments.router)
app.include_router(enrollments.router)
app.include_router(classes.router)
app.include_router(grades.router)
app.include_router(reviews.router)
app.include_router(reports.router)


@app.get("/")
def root():
    return {"message": "Welcome to Student Grading System API"}
