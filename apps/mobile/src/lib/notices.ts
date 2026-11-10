// Avisos passados entre ecrãs pelo parâmetro "aviso" do endereço.
export const NOTICES: Record<string, string> = {
  foto: 'A conta foi criada, mas a foto não foi guardada. Podes adicioná-la mais tarde no Perfil.',
};

export const noticeFor = (key?: string | string[]) => (typeof key === 'string' ? NOTICES[key] ?? null : null);
