"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteAccount } from "./actions";
import { toast } from "sonner";

export function DeleteAccountSection() {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== "löschen") return;

    setIsDeleting(true);
    try {
      const result = await deleteAccount();
      if (!result.success) {
        toast.error("Fehler beim Löschen des Accounts", {
          description: result.message,
        });
        setIsDeleting(false);
        setIsOpen(false);
      }
      // If success, we are redirected anyway
    } catch {
      toast.error("Ein unerwarteter Fehler ist aufgetreten");
      setIsDeleting(false);
      setIsOpen(false);
    }
  };

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-destructive">Account löschen</CardTitle>
        <CardDescription>
          Lösche deinen Account und alle damit verbundenen Daten permanent.
          Diese Aktion kann nicht rückgängig gemacht werden.
        </CardDescription>
      </CardHeader>
      <CardFooter className="bg-destructive/5 border-t border-destructive/20 py-4">
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full sm:w-auto">
              <Trash2 className="mr-2 h-4 w-4" />
              Account löschen
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Bist du absolut sicher?</AlertDialogTitle>
              <AlertDialogDescription>
                Diese Aktion kann nicht rückgängig gemacht werden. Dein Account
                wird permanent gelöscht und alle deine Daten (Drucke, Filamente,
                Einstellungen) werden entfernt.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4 space-y-2">
              <Label htmlFor="confirm-delete">
                Tippe &quot;löschen&quot; zur Bestätigung
              </Label>
              <Input
                id="confirm-delete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="löschen"
                className="col-span-3"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmText("")}>
                Abbrechen
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
                disabled={confirmText !== "löschen" || isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Wird gelöscht..." : "Löschen bestätigen"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
