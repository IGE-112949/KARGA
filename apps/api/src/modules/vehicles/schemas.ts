export type PlugType = 'type2' | 'schuko' | 'ccs';

export type VehicleDto = {
  id: string;
  makeModel: string;
  plate: string;
  plugType: PlugType;
  isDefault: boolean;
};
