export interface Idea {
  id: string;
  profileId: string;
  userId: string;
  title: string;
  content: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIdeaInput {
  profileId: string;
  userId: string;
  title: string;
  content?: string;
}
