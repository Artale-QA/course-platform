'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface Lesson {
  id: number;
  title: string;
  description: string;
  orderIndex: number;
  courseId: number;
  videoUrl?: string;
  materials?: Material[];
}

interface Material {
  id: number;
  fileName: string;
  filePath: string;
  uploadedAt: string;
}

interface Homework {
  id: number;
  title: string;
  description: string;
  createdAt: string;
}

interface Submission {
  id: number;
  comment: string;
  filePath: string;
  status: string;
  teacherComment: string;
  submittedAt: string;
  checkedAt: string;
}

export default function LessonPage() {
  const { id, lessonId } = useParams();
  const { user } = useAuth();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [submissionHistory, setSubmissionHistory] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [comment, setComment] = useState('');
  const [submitStatus, setSubmitStatus] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  const isStudent = user?.role === 'STUDENT';
  const canSubmit = isStudent && (!submission || submission.status !== 'APPROVED');

  const getFileIcon = (fileName: string): string => {
    if (fileName.endsWith('.pdf')) return '📄';
    if (fileName.endsWith('.mp4')) return '🎬';
    if (fileName.endsWith('.mp3')) return '🎵';
    if (fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return '🖼️';
    if (fileName.match(/\.(txt|doc|docx)$/i)) return '📝';
    return '📎';
  };

  const handleDownload = async (filePath: string, fileName?: string) => {
    try {
      setDownloadingFile(filePath);
      const response = await api.get(`/minio/download/${filePath}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      let filename = fileName || filePath.split('/').pop() || 'download';
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error: any) {
      console.error('Download error:', error);
      if (error.response?.status === 403) {
        alert('Необходимо авторизоваться для скачивания файла');
      } else {
        alert('Ошибка при скачивании файла');
      }
    } finally {
      setDownloadingFile(null);
    }
  };

  const refreshData = async () => {
    if (!isStudent) return;
    try {
      const [submissionRes, historyRes] = await Promise.all([
        api.get(`/submissions/lesson/${lessonId}/my-submission`).catch(() => ({ data: null })),
        api.get(`/submissions/lesson/${lessonId}/history`).catch(() => ({ data: [] }))
      ]);
      setSubmission(submissionRes.data);
      setSubmissionHistory(historyRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const isAuth = !!token;
    setIsAuthenticated(isAuth);

    if (!id || !lessonId) {
      setLoading(false);
      return;
    }

    const lessonUrl = `/courses/${id}/lessons/${lessonId}`;
    
    const promises: Promise<any>[] = [api.get(lessonUrl)];
    
    if (isAuth) {
      promises.push(api.get(`/lessons/${lessonId}/homework`));
      
      if (isStudent) {
        promises.push(api.get(`/submissions/lesson/${lessonId}/my-submission`).catch(() => ({ data: null })));
        promises.push(api.get(`/submissions/lesson/${lessonId}/history`).catch(() => ({ data: [] })));
      }
    }
    
    Promise.all(promises)
      .then(([lessonRes, homeworkRes, submissionRes, historyRes]) => {
        setLesson(lessonRes.data);
        setMaterials(lessonRes.data.materials || []);
        if (homeworkRes) setHomework(homeworkRes.data);
        if (submissionRes?.data) setSubmission(submissionRes.data);
        if (historyRes?.data) setSubmissionHistory(historyRes.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [id, lessonId, isStudent]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setSubmitStatus('Выберите файл');
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('comment', comment);

    try {
      await api.post(`/submissions/submit/${lessonId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSubmitStatus('✅ Работа успешно отправлена!');
      setSelectedFile(null);
      setComment('');
      setIsEditing(false);
      await refreshData();
    } catch (err: any) {
      setSubmitStatus('❌ Ошибка отправки. Возможно, вы уже отправляли работу.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedFile && !comment) {
      setSubmitStatus('Измените комментарий или выберите файл');
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    if (selectedFile) formData.append('file', selectedFile);
    if (comment) formData.append('comment', comment);

    try {
      await api.put(`/submissions/${submission?.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSubmitStatus('✅ Работа обновлена!');
      setSelectedFile(null);
      setComment('');
      setIsEditing(false);
      await refreshData();
    } catch (err: any) {
      setSubmitStatus('❌ Ошибка обновления');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Удалить работу? Это действие нельзя отменить.')) return;
    
    try {
      await api.delete(`/submissions/${submission?.id}`);
      setSubmitStatus('✅ Работа удалена');
      await refreshData();
    } catch (err: any) {
      setSubmitStatus('❌ Ошибка удаления');
    }
  };

  const handleResubmit = () => {
    setComment('');
    setSelectedFile(null);
    setIsEditing(true);
    setSubmitStatus('');
  };

  if (!lesson) return <div className="loading-placeholder" />;

  return (
    <div className="courses-page">
      <div className="courses-container">
        <div className="courses-header">
          <h1 className="courses-title">{lesson.title}</h1>
          <p className="courses-subtitle">Урок {lesson.orderIndex} • {lesson.courseId ? `Курс #${lesson.courseId}` : 'Курс'}</p>
        </div>

        {lesson.videoUrl && (
          <div className="lesson-video">
            <video 
              controls 
              className="video-player"
              preload="metadata"
            >
              <source src={`http://localhost:8080/minio/view/${lesson.videoUrl}`} type="video/mp4" />
              Ваш браузер не поддерживает видео
            </video>
          </div>
        )}
        
        {/* Блок материалов */}
        {materials.length > 0 && (
          <div className="materials-section">
            <h2 className="materials-title">📎 Материалы к уроку</h2>
            <div className="materials-list">
              {materials.map(material => (
                <div key={material.id} className="material-item">
                  <span className="material-icon">{getFileIcon(material.fileName)}</span>
                  <a 
                    href={`http://localhost:8080/minio/view/${material.filePath}`}
                    className="material-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {material.fileName}
                  </a>
                  <span className="material-date">
                    {new Date(material.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {isAuthenticated ? (
          <>
            <div className="lesson-content">
              <p>{lesson.description}</p>
            </div>

            {homework.length > 0 && (
              <div className="homework-section">
                <h2 className="homework-title">📝 Домашнее задание</h2>
                {homework.map(hw => (
                  <div key={hw.id} className="homework-item">
                    <h3 className="homework-item-title">{hw.title}</h3>
                    <p className="homework-item-description">{hw.description}</p>
                  </div>
                ))}
                
                {isStudent ? (
                  <>
                    {submission && (
                      <div className="submission-current">
                        <h3 className="submission-title">📤 Ваша последняя работа</h3>
                        <div className="submission-info">
                          <div className="submission-row">
                            <strong>Комментарий:</strong> 
                            <span>{submission.comment || '—'}</span>
                          </div>
                          <div className="submission-row">
                            <strong>Файл:</strong> 
                            <button
                              onClick={() => handleDownload(submission.filePath)}
                              disabled={downloadingFile === submission.filePath}
                              className="file-link-btn"
                            >
                              {downloadingFile === submission.filePath ? '⏳ Загрузка...' : '📎 Скачать'}
                            </button>
                          </div>
                          <div className="submission-row">
                            <strong>Статус:</strong> 
                            <span className={`status-badge status-${submission.status.toLowerCase()}`}>
                              {submission.status === 'PENDING' ? '⏳ На проверке' :
                               submission.status === 'APPROVED' ? '✅ Принято' :
                               '❌ Отклонено'}
                            </span>
                          </div>
                          {submission.teacherComment && (
                            <div className="submission-row teacher-comment">
                              <strong>💬 Комментарий учителя:</strong> 
                              <span>{submission.teacherComment}</span>
                            </div>
                          )}
                        </div>
                        
                        {submission.status === 'PENDING' && !isEditing && (
                          <div className="submission-actions">
                            <button onClick={() => setIsEditing(true)} className="btn-edit">
                              ✏️ Редактировать
                            </button>
                            <button onClick={handleDelete} className="btn-delete">
                              🗑️ Удалить
                            </button>
                          </div>
                        )}
                        
                        {submission.status === 'REJECTED' && !isEditing && (
                          <div className="submission-rejected">
                            <p className="rejected-message">⚠️ Работа отклонена. Отправьте исправленную версию.</p>
                            <button onClick={handleResubmit} className="btn-resubmit">
                              📤 Отправить заново
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {canSubmit && (!submission || (submission.status === 'PENDING' && isEditing) || (submission?.status === 'REJECTED' && isEditing)) && (
                      <div className="submission-form">
                        <h3 className="submission-form-title">
                          {submission?.status === 'REJECTED' ? '📤 Отправить исправленную работу' : 
                           submission ? '✏️ Редактировать работу' : '📤 Отправить работу'}
                        </h3>
                        
                        <div className="form-group">
                          <label className="form-label">Комментарий к работе</label>
                          <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="form-textarea"
                            rows={3}
                            placeholder="Опишите, что сделали..."
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">Файл с работой</label>
                          <input type="file" onChange={handleFileChange} className="form-file" />
                          {submission && <p className="form-hint">Оставьте пустым, чтобы не менять файл</p>}
                        </div>
                        
                        <div className="form-actions">
                          <button
                            onClick={() => {
                              if (submission?.status === 'REJECTED') {
                                handleSubmit();
                              } 
                              else if (submission?.status === 'PENDING' && isEditing) {
                                handleUpdate();
                              }
                              else if (!submission) {
                                handleSubmit();
                              }
                              else {
                                handleUpdate();
                              }
                            }}
                            disabled={submitting}
                            className="btn-submit"
                          >
                            {submitting ? 'Отправка...' : (
                              submission?.status === 'REJECTED' ? 'Отправить заново' :
                              submission ? 'Обновить' : 'Отправить работу'
                            )}
                          </button>
                          {isEditing && (
                            <button onClick={() => setIsEditing(false)} className="btn-cancel">
                              Отмена
                            </button>
                          )}
                        </div>
                        
                        {submitStatus && <p className="submit-status">{submitStatus}</p>}
                      </div>
                    )}

                    {submissionHistory.length > 1 && (
                      <div className="submission-history">
                        <h3 className="history-title">📜 История ваших отправок</h3>
                        <div className="history-list">
                          {submissionHistory.map((item, index) => (
                            <div key={item.id} className="history-item">
                              <div className="history-header">
                                <strong>Попытка {submissionHistory.length - index}</strong>
                                <span className={`status-badge status-${item.status.toLowerCase()}`}>
                                  {item.status === 'PENDING' ? '⏳ На проверке' :
                                   item.status === 'APPROVED' ? '✅ Принято' :
                                   '❌ Отклонено'}
                                </span>
                              </div>
                              <p><strong>📝 Комментарий:</strong> {item.comment || '—'}</p>
                              <p>
                                <strong>📎 Файл:</strong>
                                <button
                                  onClick={() => handleDownload(item.filePath)}
                                  disabled={downloadingFile === item.filePath}
                                  className="file-link-btn"
                                >
                                  {downloadingFile === item.filePath ? '⏳ Загрузка...' : '📎 Скачать'}
                                </button>
                              </p>
                              <p><strong>📅 Дата:</strong> {new Date(item.submittedAt).toLocaleString()}</p>
                              {item.teacherComment && <p><strong>💬 Комментарий учителя:</strong> {item.teacherComment}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="homework-info">
                    <p>📌 Задание доступно для выполнения студентам.</p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="auth-required">
            <p className="auth-required-text">
              🔒 Полное содержание урока доступно только авторизованным пользователям.
            </p>
            <div className="auth-buttons">
              <Link href="/login" className="btn-login">Войти</Link>
              <span className="auth-or">или</span>
              <Link href="/register" className="btn-register">Зарегистрироваться</Link>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .file-link-btn {
          background: none;
          border: none;
          color: #0070f3;
          cursor: pointer;
          font-size: inherit;
          padding: 0;
          text-decoration: underline;
        }
        .file-link-btn:hover {
          color: #0050b3;
        }
        .file-link-btn:disabled {
          color: #999;
          cursor: not-allowed;
        }
        .materials-section {
          margin: 1.5rem 0;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 0.75rem;
        }
        .materials-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: #1f2937;
        }
        .materials-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .material-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          background: white;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
        }
        .material-icon {
          font-size: 1.25rem;
        }
        .material-link {
          flex: 1;
          color: #3b82f6;
          text-decoration: none;
        }
        .material-link:hover {
          text-decoration: underline;
        }
        .material-date {
          font-size: 0.75rem;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}