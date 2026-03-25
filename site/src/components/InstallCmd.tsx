import { Tabs, TabsList, TabsTrigger, TabsContent } from '#/components/ui/tabs'
import {
  usePackageManager,
  getInstallCommand,
  type PackageManager,
} from '#/lib/package-manager'

const packageName = import.meta.env.VITE_PACKAGE_NAME ?? 'colander'
const packages = `${packageName} @js-temporal/polyfill`

const managers: PackageManager[] = ['npm', 'pnpm', 'yarn', 'ni']

export default function InstallCmd() {
  const { pm, setPm } = usePackageManager()

  return (
    <div className="my-4">
      <Tabs
        value={pm}
        onValueChange={(v) => setPm(v as PackageManager)}
        className="gap-0"
      >
        <TabsList variant="line" className="h-auto rounded-t-lg border border-b-0 border-line bg-surface p-0">
          {managers.map((m) => (
            <TabsTrigger key={m} value={m} className="type-body-100-bold px-4 py-2">
              {m}
            </TabsTrigger>
          ))}
        </TabsList>
        {managers.map((m) => (
          <TabsContent key={m} value={m}>
            <pre className="type-code-200 overflow-x-auto rounded-b-lg border border-line bg-surface-strong p-4">
              <code>{getInstallCommand(m, packages)}</code>
            </pre>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
