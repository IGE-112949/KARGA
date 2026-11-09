import { ComingSoon } from '@/ui/ComingSoon';
import { useMode } from '@/profile/ModeContext';

export default function Home() {
  const { mode } = useMode();
  return mode === 'driver' ? <ComingSoon title="Mapa" icon="map" /> : <ComingSoon title="Início" icon="grid" />;
}
