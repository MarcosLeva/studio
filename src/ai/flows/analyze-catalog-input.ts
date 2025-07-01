'use server';

/**
 * @fileOverview Analyzes a catalog input file based on a pre-defined category and prompt.
 *
 * - analyzeCatalogInput - A function that handles the catalog analysis process.
 * - AnalyzeCatalogInputInput - The input type for the analyzeCatalogInput function.
 * - AnalyzeCatalogInputOutput - The return type for the analyzeCatalogInput function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeCatalogInputInputSchema = z.object({
  categoryName: z.string().describe('The name of the category to use for analysis.'),
  catalogName: z.string().describe('The name of the catalog being analyzed.'),
  fileDataUris: z
    .array(z.string())
    .describe(
      'The catalog files data, as an array of data URIs. Each URI must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
  instructions: z.string().describe('Instructions for the AI model to follow during analysis.'),
  prompt: z.string().describe('The prompt to use for analyzing the catalog.'),
});
export type AnalyzeCatalogInputInput = z.infer<typeof AnalyzeCatalogInputInputSchema>;

const AnalyzeCatalogInputOutputSchema = z.object({
  analysisResults: z.string().describe('The results of the catalog analysis.'),
});
export type AnalyzeCatalogInputOutput = z.infer<typeof AnalyzeCatalogInputOutputSchema>;

export async function analyzeCatalogInput(input: AnalyzeCatalogInputInput): Promise<AnalyzeCatalogInputOutput> {
  return analyzeCatalogInputFlow(input);
}

const analyzeCatalogInputPrompt = ai.definePrompt({
  name: 'analyzeCatalogInputPrompt',
  input: {schema: AnalyzeCatalogInputInputSchema},
  output: {schema: AnalyzeCatalogInputOutputSchema},
  prompt: `You are an expert at analyzing catalogs based on specific categories and instructions.

  Category Name: {{{categoryName}}}
  Catalog Name: {{{catalogName}}}
  Instructions: {{{instructions}}}

  Analyze the following catalog content and extract relevant information based on the prompt:

  Prompt: {{{prompt}}}
  
  Catalog Content: 
  {{#each fileDataUris}}
  {{media url=this}}
  {{/each}}
  `,
});

const analyzeCatalogInputFlow = ai.defineFlow(
  {
    name: 'analyzeCatalogInputFlow',
    inputSchema: AnalyzeCatalogInputInputSchema,
    outputSchema: AnalyzeCatalogInputOutputSchema,
  },
  async input => {
    const {output} = await analyzeCatalogInputPrompt(input);
    return output!;
  }
);
