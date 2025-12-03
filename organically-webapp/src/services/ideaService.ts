import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { Idea, CreateIdeaInput } from "@/types/idea";

const IDEAS_COLLECTION = "ideas";

/**
 * Create a new idea
 */
export async function createIdea(input: CreateIdeaInput): Promise<Idea> {
  try {
    const ideaId = doc(collection(db, IDEAS_COLLECTION)).id;
    const now = new Date();

    const idea: Idea = {
      id: ideaId,
      ...input,
      convertedToPost: false,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, IDEAS_COLLECTION, ideaId), {
      ...idea,
      createdAt: Timestamp.fromDate(idea.createdAt),
      updatedAt: Timestamp.fromDate(idea.updatedAt),
    });

    return idea;
  } catch (error) {
    console.error("Error creating idea:", error);
    throw error;
  }
}

/**
 * Get an idea by ID
 */
export async function getIdea(ideaId: string): Promise<Idea | null> {
  try {
    const docRef = doc(db, IDEAS_COLLECTION, ideaId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as Idea;
  } catch (error) {
    console.error("Error getting idea:", error);
    throw error;
  }
}

/**
 * Get all ideas for a profile
 */
export async function getIdeasByProfile(profileId: string): Promise<Idea[]> {
  try {
    const q = query(
      collection(db, IDEAS_COLLECTION),
      where("profileId", "==", profileId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const ideas: Idea[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      ideas.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as Idea);
    });

    return ideas;
  } catch (error) {
    console.error("Error getting ideas:", error);
    throw error;
  }
}

/**
 * Update an idea
 */
export async function updateIdea(
  ideaId: string,
  updates: Partial<Omit<Idea, "id" | "profileId" | "userId" | "createdAt">>
): Promise<void> {
  try {
    const docRef = doc(db, IDEAS_COLLECTION, ideaId);

    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  } catch (error) {
    console.error("Error updating idea:", error);
    throw error;
  }
}

/**
 * Delete an idea
 */
export async function deleteIdea(ideaId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, IDEAS_COLLECTION, ideaId));
  } catch (error) {
    console.error("Error deleting idea:", error);
    throw error;
  }
}

