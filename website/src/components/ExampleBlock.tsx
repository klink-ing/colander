import { Tabs, TabsList, TabsTrigger, TabsContent } from "#/components/ui/tabs";

const highlighted = import.meta.glob<{
  tsHtml: string;
  jsHtml: string;
  language: string;
}>("../examples/*.highlighted.gen.json", { eager: true });

function getHighlighted(file: string) {
  const key = `../examples/${file.replace(/\.tsx?$/, "")}.highlighted.gen.json`;
  return highlighted[key];
}

export default function ExampleBlock({ file }: { file: string }) {
  const data = getHighlighted(file);
  if (!data) {
    return (
      <div className="my-6 squircle-lg border border-border p-4">
        <pre>
          <code>// Example not found: {file}</code>
        </pre>
      </div>
    );
  }

  const { tsHtml, jsHtml } = data;

  return (
    <div className="my-6">
      <Tabs defaultValue="ts" className="gap-0">
        <div className="flex items-center squircle-t-lg border border-b-0 border-border bg-card">
          <TabsList variant="line" className="h-auto p-0">
            <TabsTrigger value="ts" className="px-4 py-2 type-body-100-bold">
              TypeScript
            </TabsTrigger>
            <TabsTrigger value="js" className="px-4 py-2 type-body-100-bold">
              JavaScript
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="ts">
          <div
            className="overflow-x-auto border border-border [&_pre]:m-0 [&_pre]:border-0 [&_pre]:p-4"
            dangerouslySetInnerHTML={{ __html: tsHtml }}
          />
        </TabsContent>
        <TabsContent value="js">
          <div
            className="overflow-x-auto squircle-b-lg border border-border [&_pre]:m-0 [&_pre]:border-0 [&_pre]:p-4"
            dangerouslySetInnerHTML={{ __html: jsHtml }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
