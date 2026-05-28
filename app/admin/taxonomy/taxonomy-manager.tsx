"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { createTagGroup, createTag, deleteTag, deleteTagGroup } from "../actions"

type Tag = { id: string; name: string }
type TagGroup = { id: string; name: string; description: string | null; tags: Tag[] }

export function TaxonomyManager({ tagGroups }: { tagGroups: TagGroup[] }) {
  const [groupOpen, setGroupOpen] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [groupDesc, setGroupDesc] = useState("")
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({})

  async function handleCreateGroup() {
    if (!groupName.trim()) return
    await createTagGroup({
      name: groupName.trim(),
      description: groupDesc.trim() || undefined,
    })
    setGroupName("")
    setGroupDesc("")
    setGroupOpen(false)
  }

  async function handleCreateTag(groupId: string) {
    const name = tagInputs[groupId]?.trim()
    if (!name) return
    await createTag({ groupId, name })
    setTagInputs({ ...tagInputs, [groupId]: "" })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Taxonomy</h1>
          <p className="text-muted-foreground mt-1">
            Organize questions with tag groups and tags
          </p>
        </div>
        <Dialog open={groupOpen} onOpenChange={setGroupOpen}>
          <DialogTrigger asChild>
            <Button>New group</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create tag group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder='e.g. "modality" or "construct"'
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  placeholder="Optional description..."
                />
              </div>
              <Button onClick={handleCreateGroup} className="w-full">Create group</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {tagGroups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No tag groups yet. Create groups like "modality" and "construct".
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tagGroups.map((group) => (
            <Card key={group.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  {group.description && (
                    <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
                  )}
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-destructive">Delete group</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete "{group.name}"?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will delete the group and all its tags. Questions will lose these tags.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteTagGroup(group.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {group.tags.map((tag) => (
                    <Badge key={tag.id} variant="secondary" className="gap-1 pr-1">
                      {tag.name}
                      <button
                        onClick={() => deleteTag(tag.id)}
                        className="ml-1 rounded-full hover:bg-destructive/20 px-1 text-xs"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                  {group.tags.length === 0 && (
                    <span className="text-sm text-muted-foreground">No tags yet</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={tagInputs[group.id] ?? ""}
                    onChange={(e) => setTagInputs({ ...tagInputs, [group.id]: e.target.value })}
                    placeholder="New tag name..."
                    className="max-w-xs"
                    onKeyDown={(e) => e.key === "Enter" && handleCreateTag(group.id)}
                  />
                  <Button size="sm" variant="outline" onClick={() => handleCreateTag(group.id)}>
                    Add tag
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}