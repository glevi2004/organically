export interface Idea {
  id: string;
  organizationId: string;
  userId: string;
  title: string;
  content: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIdeaInput {
  organizationId: string;
  userId: string;
  title: string;
  content?: string;
}
