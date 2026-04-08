import { Tabs, TabsList, TabsTrigger, TabsContent } from "#/components/ui/tabs";

export default function ExampleBlock({
  file,
  tsHtml,
  jsHtml,
  language,
}: {
  file: string;
  tsHtml: string;
  jsHtml: string;
  language: string;
}) {
  const jsLang = language.replace("ts", "js");
  const jsFile = file.replace(/\.tsx?$/, jsLang === "jsx" ? ".jsx" : ".js");

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
          <TabsContent value="ts" className="ml-auto pr-4">
            <span className="type-code-100 text-muted-foreground">{file}</span>
          </TabsContent>
          <TabsContent value="js" className="ml-auto pr-4">
            <span className="type-code-100 text-muted-foreground">
              {jsFile}
            </span>
          </TabsContent>
        </div>
        <TabsContent value="ts">
          <div
            className="overflow-x-auto squircle-b-lg border border-border [&_pre]:m-0 [&_pre]:squircle-none [&_pre]:border-0 [&_pre]:p-4"
            dangerouslySetInnerHTML={{ __html: tsHtml }}
          />
        </TabsContent>
        <TabsContent value="js">
          <div
            className="overflow-x-auto squircle-b-lg border border-border [&_pre]:m-0 [&_pre]:squircle-none [&_pre]:border-0 [&_pre]:p-4"
            dangerouslySetInnerHTML={{ __html: jsHtml }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
