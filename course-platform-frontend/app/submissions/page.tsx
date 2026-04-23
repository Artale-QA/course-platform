'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import FileViewer from '@/app/components/FileViewer';

interface Submission {
  id: number;
  comment: string;
  filePath: string;
  fileType: string;
  status: string;
  teacherComment: string;
  submittedAt: string;
  checkedAt: string;
  student: {
    id: number;
    email: string;
    fullName: string;
  };
  lesson: {
    id: number;
    title: string;
  };
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentValues, setCommentValues] = useState<Record<number, string>>({});

  useEffect(() => {
    api.get('/submissions/pending')
      .then(res => {
      
      setSubmissions(res.data);
      setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  const handleCommentChange = (id: number, value: string) => {
    setCommentValues(prev => ({ ...prev, [id]: value }));
  };

  const checkSubmission = async (id: number, teacherComment: string, status: string) => {
    await api.put(`/submissions/${id}/check`, { 
      teacherComment, 
      status: status
    });
    setSubmissions(submissions.filter(s => s.id !== id));
    setCommentValues(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  const getFileName = (filePath: string) => {
    return filePath.split('/').pop() || 'файл';
  };

  // Кодируем только имя файла, а не весь путь
  const encodeFilePath = (filePath: string) => {
    const parts = filePath.split('/');
    const fileName = parts.pop();
    const encodedFileName = encodeURIComponent(fileName || '');
    return [...parts, encodedFileName].join('/');
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="courses-page">
      <div className="courses-container">
        <div className="courses-header">
          <h1 className="courses-title">📋 Домашние задания на проверку</h1>
          <p className="courses-subtitle">Работы студентов, ожидающие проверки</p>
        </div>
        
        {submissions.length === 0 ? (
          <div className="auth-warning" style={{ textAlign: 'center' }}>
            <p className="auth-warning-text">✨ Нет заданий на проверку</p>
          </div>
        ) : (
          <div className="submissions-grid">
            {submissions.map(sub => (
              <div key={sub.id} className="course-card" style={{ display: 'block' }}>
                <div className="course-card-content">
                  <div className="submission-student">
                    <strong>👨‍🎓 Студент:</strong> 
                    <span>{sub.student?.fullName || 'Не указан'} ({sub.student?.email || '—'})</span>
                  </div>
                  
                  <div className="submission-lesson">
                    <strong>📚 Урок:</strong> 
                    <span>{sub.lesson?.title || '—'}</span>
                  </div>
                  
                  <div className="submission-student-comment">
                    <strong>💬 Комментарий студента:</strong> 
                    <p>{sub.comment || '—'}</p>
                  </div>
                  
                  <div className="submission-file">
                    <strong>📎 Файл:</strong>
                    
                    <FileViewer 
                      fileUrl={`http://localhost:8080/minio/view/${encodeFilePath(sub.filePath)}`}
                      fileType={sub.fileType || 'application/octet-stream'}
                      fileName={getFileName(sub.filePath)}
                    />
                  </div>
                  
                  <div className="homework-section" style={{ marginTop: '1rem', padding: '1rem' }}>
                    <label className="form-label">✏️ Комментарий учителя</label>
                    <textarea
                      placeholder="Напишите замечания или похвалу..."
                      className="form-textarea"
                      value={commentValues[sub.id] || ''}
                      onChange={(e) => handleCommentChange(sub.id, e.target.value)}
                      rows={3}
                    />
                    
                    <div className="form-actions" style={{ marginTop: '1rem' }}>
                      <button
                        onClick={() => checkSubmission(sub.id, commentValues[sub.id] || '', 'APPROVED')}
                        className="btn-approve"
                      >
                        ✅ Принять работу
                      </button>
                      <button
                        onClick={() => checkSubmission(sub.id, commentValues[sub.id] || '', 'REJECTED')}
                        className="btn-delete"
                      >
                        ❌ Отклонить
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}