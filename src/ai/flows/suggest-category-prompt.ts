'use server';

/**
 * @fileOverview Suggests a prompt for a category based on the category name and optional sample files.
 *
 * - suggestCategoryPrompt - A function that suggests a prompt for a category.
 * - SuggestCategoryPromptInput - The input type for the suggestCategoryPrompt function.
 * - SuggestCategoryPromptOutput - The return type for the suggestCategoryPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestCategoryPromptInputSchema = z.object({
  categoryName: z.string().describe('The name of the category.'),
  fileDataUris: z
    .array(z.string())
    .optional()
    .describe(
      "Optional sample files data, as an array of data URIs, to help generate a better prompt. Each URI must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SuggestCategoryPromptInput = z.infer<
  typeof SuggestCategoryPromptInputSchema
>;

const SuggestCategoryPromptOutputSchema = z.object({
  suggestedPrompt: z
    .string()
    .describe('The suggested prompt for the category.'),
});
export type SuggestCategoryPromptOutput = z.infer<
  typeof SuggestCategoryPromptOutputSchema
>;

export async function suggestCategoryPrompt(
  input: SuggestCategoryPromptInput
): Promise<SuggestCategoryPromptOutput> {
  return suggestCategoryPromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCategoryPromptPrompt',
  input: {schema: SuggestCategoryPromptInputSchema},
  output: {schema: SuggestCategoryPromptOutputSchema},
  prompt: `You are an expert in creating AI prompts. A user is creating a new category for catalog analysis named "{{{categoryName}}}".
Based on the category name, suggest a concise and effective prompt for an AI model to analyze catalogs under this category.

{{#if fileDataUris}}
The user has provided the following sample file(s) for additional context. Use the content of these files to make your suggested prompt even more relevant and specific. For example, if you see product listings, suggest a prompt to extract product names and prices.

Sample Content:
{{#each fileDataUris}}
{{media url=this}}
{{/each}}
{{/if}}

Your suggested prompt should be clear and tell the AI what information to extract or what analysis to perform. Return only the suggested prompt.`,
});

const suggestCategoryPromptFlow = ai.defineFlow(
  {
    name: 'suggestCategoryPromptFlow',
    inputSchema: SuggestCategoryPromptInputSchema,
    outputSchema: SuggestCategoryPromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
