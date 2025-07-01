'use server';

/**
 * @fileOverview Suggests a prompt for a category based on the category name.
 *
 * - suggestCategoryPrompt - A function that suggests a prompt for a category.
 * - SuggestCategoryPromptInput - The input type for the suggestCategoryPrompt function.
 * - SuggestCategoryPromptOutput - The return type for the suggestCategoryPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestCategoryPromptInputSchema = z.object({
  categoryName: z.string().describe('The name of the category.'),
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
  prompt: `Suggest a good prompt for the category named "{{{categoryName}}}".`,
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
