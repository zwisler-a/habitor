import { SetMetadata } from '@nestjs/common';

export const SKIP_USER_CONTEXT_KEY = 'skipUserContext';

export const SkipUserContext = () => SetMetadata(SKIP_USER_CONTEXT_KEY, true);
