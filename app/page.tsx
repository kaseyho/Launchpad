import { FactoryShell } from '../src/components/factory-shell';
import { createInitialWorkspace } from '../src/domain/foundry-service';

export default function Home() {
  return <FactoryShell initialWorkspace={createInitialWorkspace()} />;
}
