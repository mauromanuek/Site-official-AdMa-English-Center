export type Role = 'student' | 'parent' | 'teacher';

export interface UserProfile {
  id: string;
  role: Role;
  phone: string;
  name: string;
  photo: string;
  level?: string;
  className?: string;
  schedule?: string;
  score?: number;
  teacherId?: string;
  parentId?: string;
  skills?: Record<string, string>;
  status?: 'pending' | 'approved'; // Added status for new students/parents
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  content: string;
  privacy: 'minha_turma' | 'apenas_alunos' | 'publico';
  type?: 'comunicado' | 'destaque';
  mediaUrl?: string; // Para o video ou foto
  mediaType?: 'Imagem' | 'Vídeo' | 'Nenhum';
  fileName?: string;
  createdAt: any; // Firestore Timestamp
}

export interface PedidoVinculacao {
  id: string;
  parentId: string;
  parentName: string;
  studentPhone: string;
  studentId?: string;
  teacherId?: string;
  status: 'pending' | 'approved';
  createdAt: any;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'pedido_vinculacao' | 'destaque' | 'geral';
  read: boolean;
  relatedId?: string;
  createdAt: any;
}
