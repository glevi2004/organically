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
  writeBatch,
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

    // Get existing ideas to determine order
    const existingIdeas = await getIdeasByOrganization(input.organizationId);
    const maxOrder =
      existingIdeas.length > 0
        ? Math.max(...existingIdeas.map((i) => i.order))
        : -1;

    const idea: Idea = {
      id: ideaId,
      organizationId: input.organizationId,
      userId: input.userId,
      title: input.title,
      content: input.content || "",
      order: maxOrder + 1,
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
      organizationId: data.organizationId,
      userId: data.userId,
      title: data.title,
      content: data.content || "",
      order: data.order ?? 0,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as Idea;
  } catch (error) {
    console.error("Error getting idea:", error);
    throw error;
  }
}

/**
 * Get all ideas for an organization
 */
export async function getIdeasByOrganization(organizationId: string): Promise<Idea[]> {
  try {
    const q = query(
      collection(db, IDEAS_COLLECTION),
      where("organizationId", "==", organizationId),
      orderBy("order", "asc")
    );

    const querySnapshot = await getDocs(q);
    const ideas: Idea[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      ideas.push({
        id: doc.id,
        organizationId: data.organizationId,
        userId: data.userId,
        title: data.title,
        content: data.content || "",
        order: data.order ?? 0,
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
  updates: Partial<Omit<Idea, "id" | "organizationId" | "userId" | "createdAt">>
): Promise<void> {
  try {
    const docRef = doc(db, IDEAS_COLLECTION, ideaId);

    // Filter out undefined values
    const cleanUpdates: Record<string, unknown> = {};
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    });

    await updateDoc(docRef, {
      ...cleanUpdates,
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

/**
 * Reorder ideas (batch update order field)
 */
export async function reorderIdeas(
  updates: Array<{ id: string; order: number }>
): Promise<void> {
  try {
    const batch = writeBatch(db);

    updates.forEach(({ id, order }) => {
      const docRef = doc(db, IDEAS_COLLECTION, id);
      batch.update(docRef, {
        order,
        updatedAt: Timestamp.fromDate(new Date()),
      });
    });

    await batch.commit();
  } catch (error) {
    console.error("Error reordering ideas:", error);
    throw error;
  }
}
