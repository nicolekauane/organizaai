export const isKnownProfile = profile => ['aluno', 'responsavel'].includes(profile);
export const canAccessProfile = (user, profile) => !!user && isKnownProfile(user.tipo_usuario) && user.tipo_usuario === profile;
export const homeForProfile = user => canAccessProfile(user, 'aluno') ? '/' : canAccessProfile(user, 'responsavel') ? '/acompanhamento' : '/login';
