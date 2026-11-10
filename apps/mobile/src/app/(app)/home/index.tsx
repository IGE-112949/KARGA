import { ComingSoon } from '@/ui/ComingSoon';
import { useMode } from '@/profile/ModeContext';
import { MapScreen } from '@/search/MapScreen';

export default function Home() {
  const { mode } = useMode();
  return mode === 'driver' ? <MapScreen /> : <ComingSoon title="Início" icon="grid" />;
}
