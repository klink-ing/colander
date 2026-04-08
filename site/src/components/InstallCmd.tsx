import { Code } from "#/components/ui/code";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "#/components/ui/tabs";
import {
  usePackageManager,
  getInstallCommand,
  type PackageManager,
} from "#/lib/package-manager";

const packageName = import.meta.env.VITE_PACKAGE_NAME ?? "colander";
const packages = `${packageName} @js-temporal/polyfill`;

const managers: PackageManager[] = ["npm", "pnpm", "yarn", "ni"];

export default function InstallCmd() {
  const { pm, setPm } = usePackageManager();

  return (
    <div className="my-4">
      <Tabs
        value={pm}
        onValueChange={(v) => setPm(v as PackageManager)}
        className="gap-0"
      >
        <TabsList
          variant="line"
          className="h-auto squircle-t-lg border border-b-0 border-border bg-card p-0"
        >
          {managers.map((m) => (
            <TabsTrigger
              key={m}
              value={m}
              className="px-4 py-2 type-body-100-bold"
            >
              {m}
            </TabsTrigger>
          ))}
        </TabsList>
        {managers.map((m) => (
          <TabsContent key={m} value={m}>
            <pre className="overflow-x-auto squircle-b-lg border border-border bg-muted p-4 type-code-200">
              <Code size={200}>{getInstallCommand(m, packages)}</Code>
            </pre>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
