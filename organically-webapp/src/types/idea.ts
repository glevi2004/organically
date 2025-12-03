export interface Idea {
  id: string;
  profileId: string;
  userId: string;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIdeaInput {
  profileId: string;
  userId: string;
  title: string;
  description: string;
}
