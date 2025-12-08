import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "organically" });

// Event types for type safety
export type Events = {
  "post/schedule-publish": {
    data: {
      postId: string;
      organizationId: string;
      scheduledDate: string;
    };
  };
};
