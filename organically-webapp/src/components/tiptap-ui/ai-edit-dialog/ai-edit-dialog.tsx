"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles } from "lucide-react";

interface AIEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedText: string;
  onConfirm: (instruction: string) => Promise<void>;
}

export function AIEditDialog({
  open,
  onOpenChange,
  selectedText,
  onConfirm,
}: AIEditDialogProps) {
  const [instruction, setInstruction] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim()) return;

    setIsProcessing(true);
    try {
      await onConfirm(instruction.trim());
      setInstruction("");
      onOpenChange(false);
    } catch (error) {
      console.error("AI edit error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            AI Edit
          </DialogTitle>
          <DialogDescription>
            Describe how you want to edit the selected text. The AI will replace
            it based on your instructions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="selected-text">Selected Text</Label>
            <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground max-h-32 overflow-y-auto">
              {selectedText || "No text selected"}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instruction">Your Instructions</Label>
            <Textarea
              id="instruction"
              placeholder="e.g., Make it more professional, Rewrite in a friendly tone, Make it shorter, Add more detail..."
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              disabled={isProcessing}
              rows={4}
              className="resize-none"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isProcessing || !instruction.trim()}>
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Apply AI Edit
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

