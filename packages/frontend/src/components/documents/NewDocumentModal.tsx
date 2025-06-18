import { useState } from 'react';
import { css } from '@emotion/css';

interface NewDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, isPublic: boolean) => void;
}

export function NewDocumentModal({ isOpen, onClose, onCreate }: NewDocumentModalProps) {
  const [title, setTitle] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    await onCreate(title.trim(), isPublic);
    setTitle('');
    setIsPublic(false);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setTitle('');
      setIsPublic(false);
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <i className="fa-solid fa-file-plus" />
            Create New Document
          </h2>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="document-title" className={styles.label}>
              Document Title
            </label>
            <input
              id="document-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter document title..."
              className={styles.input}
              disabled={isSubmitting}
              autoFocus
              maxLength={100}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                disabled={isSubmitting}
                className={styles.checkbox}
              />
              <div>
                <span className={styles.checkboxText}>Make document public</span>
                <p className={styles.checkboxHint}>
                  Public documents can be viewed by anyone with the link
                </p>
              </div>
            </label>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className={styles.createButton}
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check" />
                  Create Document
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: css`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.2s ease;
    
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
  `,

  modal: css`
    background: white;
    border-radius: 16px;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    animation: slideUp 0.3s ease;
    
    @keyframes slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `,

  header: css`
    padding: 24px 24px 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    display: flex;
    align-items: center;
    justify-content: space-between;
  `,

  title: css`
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #1a1a1a;
    display: flex;
    align-items: center;
    gap: 10px;
    
    i {
      color: #007bff;
    }
  `,

  closeButton: css`
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: rgba(0, 0, 0, 0.05);
    color: #6b7280;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 18px;
    
    &:hover:not(:disabled) {
      background: rgba(0, 0, 0, 0.1);
      color: #374151;
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `,

  form: css`
    padding: 24px;
  `,

  field: css`
    margin-bottom: 20px;
  `,

  label: css`
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
  `,

  input: css`
    width: 100%;
    padding: 12px 16px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    font-size: 16px;
    font-family: inherit;
    transition: all 0.2s;
    
    &:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }
    
    &:disabled {
      background: #f9fafb;
      opacity: 0.7;
      cursor: not-allowed;
    }
    
    &::placeholder {
      color: #9ca3af;
    }
  `,

  checkboxLabel: css`
    display: flex;
    align-items: flex-start;
    gap: 12px;
    cursor: pointer;
    padding: 12px;
    border-radius: 8px;
    transition: background 0.2s;
    
    &:hover {
      background: rgba(0, 0, 0, 0.02);
    }
  `,

  checkbox: css`
    width: 20px;
    height: 20px;
    margin-top: 2px;
    cursor: pointer;
    
    &:disabled {
      cursor: not-allowed;
    }
  `,

  checkboxText: css`
    font-size: 16px;
    font-weight: 500;
    color: #1a1a1a;
  `,

  checkboxHint: css`
    margin: 4px 0 0;
    font-size: 14px;
    color: #6b7280;
  `,

  actions: css`
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 28px;
    padding-top: 20px;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
  `,

  cancelButton: css`
    padding: 10px 20px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    background: white;
    font-size: 15px;
    font-weight: 500;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover:not(:disabled) {
      background: #f9fafb;
      border-color: rgba(0, 0, 0, 0.15);
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `,

  createButton: css`
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
    font-size: 15px;
    font-weight: 500;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
    
    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 123, 255, 0.35);
    }
    
    &:disabled {
      background: #e5e7eb;
      color: #9ca3af;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    
    i {
      font-size: 14px;
    }
  `
};