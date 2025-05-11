"use client";

import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
} from "@/lib/redux/services/settingsApi";
import { Constants } from "@/types/database.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const availableCategories = Constants.public.Enums.note_category;

const settingsFormSchema = z.object({
  chat_prompt: z.string().nullable(),
  chat_system_instructions: z.string().nullable(),
  cluster_prompt: z.string().nullable(),
  tag_prompt: z.string().nullable(),
  merge_tag_prompt: z.string().nullable(),
  pinned_categories: z.array(z.string()).nullable(),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export default function SettingsPage() {
  const { data: settings, isLoading, isError } = useGetSettingsQuery();
  const [updateSettings, { isLoading: isUpdating }] =
    useUpdateSettingsMutation();
  const { toast } = useToast();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      chat_prompt: "",
      chat_system_instructions: "",
      cluster_prompt: "",
      tag_prompt: "",
      merge_tag_prompt: "",
      pinned_categories: [],
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        chat_prompt: settings.chat_prompt,
        chat_system_instructions: settings.chat_system_instructions,
        cluster_prompt: settings.cluster_prompt,
        tag_prompt: settings.tag_prompt,
        merge_tag_prompt: settings.merge_tag_prompt,
        pinned_categories: (Array.isArray(settings.pinned_categories)
          ? settings.pinned_categories
          : []) as string[],
      });
    }
  }, [settings, form]);

  async function onSubmit(data: SettingsFormValues) {
    try {
      const submissionData = {
        ...data,
        pinned_categories: data.pinned_categories || [],
      };
      await updateSettings(submissionData).unwrap();
      toast({
        title: "Settings updated",
        description: "Your settings have been saved successfully.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    }
  }

  const watchedPinnedCategories = form.watch("pinned_categories") || [];

  const handleToggleCategory = (category: string, checked: boolean) => {
    const currentPinned = form.getValues("pinned_categories") || [];
    let newPinned: string[];
    if (checked) {
      newPinned = [...currentPinned, category];
    } else {
      newPinned = currentPinned.filter((c) => c !== category);
    }
    form.setValue("pinned_categories", newPinned);
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const currentPinned = [...(form.getValues("pinned_categories") || [])];
    const item = currentPinned[index];
    if (direction === "up" && index > 0) {
      currentPinned.splice(index, 1);
      currentPinned.splice(index - 1, 0, item);
    } else if (direction === "down" && index < currentPinned.length - 1) {
      currentPinned.splice(index, 1);
      currentPinned.splice(index + 1, 0, item);
    }
    form.setValue("pinned_categories", currentPinned);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        <div className="bg-card rounded-lg border shadow-sm p-6">
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        <div className="bg-card rounded-lg border shadow-sm p-6">
          <p className="text-destructive">
            Failed to load settings. Please refresh the page and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>AI Prompts</CardTitle>
            <CardDescription>
              Configure the prompts used by AI in different parts of the
              application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* <FormField
                  control={form.control}
                  name="chat_prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chat Prompt</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter a prompt for the chat interface"
                          className="min-h-[100px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        This prompt will be used to initialize the chat UI.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}

                <FormField
                  control={form.control}
                  name="chat_system_instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chat System Instructions</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter system instructions for the chat AI"
                          className="min-h-[100px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        System instructions that guide how the AI responds in
                        chat.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Pinned Categories Section */}
                <FormItem>
                  <FormLabel>Select Pinned Categories</FormLabel>
                  <FormDescription>
                    Choose which categories to pin. Their order can be adjusted
                    below.
                  </FormDescription>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                    {availableCategories.map((category) => (
                      <FormItem
                        key={category}
                        className="flex flex-row items-center space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={watchedPinnedCategories.includes(category)}
                            onCheckedChange={(checked) =>
                              handleToggleCategory(category, !!checked)
                            }
                          />
                        </FormControl>
                        <FormLabel className="font-normal capitalize">
                          {category}
                        </FormLabel>
                      </FormItem>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>

                {watchedPinnedCategories.length > 0 && (
                  <FormItem>
                    <FormLabel>Order Pinned Categories</FormLabel>
                    <FormDescription>
                      Drag and drop or use buttons to reorder your pinned
                      categories.
                    </FormDescription>
                    <div className="space-y-2 pt-2 border rounded-md p-2 mt-2">
                      {watchedPinnedCategories.map((category, index) => (
                        <div
                          key={category}
                          className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                        >
                          <span className="capitalize">{category}</span>
                          <div className="flex space-x-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMove(index, "up")}
                              disabled={index === 0}
                              className="h-7 w-7"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMove(index, "down")}
                              disabled={
                                index === watchedPinnedCategories.length - 1
                              }
                              className="h-7 w-7"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </FormItem>
                )}

                <FormField
                  control={form.control}
                  name="cluster_prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cluster Prompt</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter a prompt for clustering"
                          className="min-h-[100px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        This prompt guides how items are clustered together.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tag_prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tag Prompt</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter a prompt for tag generation"
                          className="min-h-[100px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        This prompt is used when generating tags for content.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="merge_tag_prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Merge Tag Prompt</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter a prompt for tag merging suggestions"
                          className="min-h-[100px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        This prompt is used when suggesting tags to merge.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? "Saving..." : "Save Settings"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
            <CardDescription>
              Manage your account settings and actions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={logout}>
              <Button type="submit" variant="destructive">
                Logout
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
