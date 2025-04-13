"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const settingsFormSchema = z.object({
  chat_prompt: z.string().nullable(),
  chat_system_instructions: z.string().nullable(),
  cluster_prompt: z.string().nullable(),
  tag_prompt: z.string().nullable(),
  merge_tag_prompt: z.string().nullable(),
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
      });
    }
  }, [settings, form]);

  async function onSubmit(data: SettingsFormValues) {
    try {
      await updateSettings(data).unwrap();
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
      </div>
    </div>
  );
}
