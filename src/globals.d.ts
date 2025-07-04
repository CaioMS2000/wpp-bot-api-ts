import type * as TsUtils from '@caioms/ts-utils';
import type * as NextjsUtils from '@caioms/ts-utils/nextjs';

declare global {
  type Optional<T, K> = TsUtils.Optional<T, K>;
  type RequireOnly<T, K> = TsUtils.RequireOnly<T, K>;
  type NotDefined<T> = TsUtils.NotDefined<T>;
  type Nullable<T> = TsUtils.Nullable<T>;
  type Voidable<T> = TsUtils.Voidable<T>;
  type Params = NextjsUtils.Params;
  type SearchParams = NextjsUtils.SearchParams;
  interface PageProps extends NextjsUtils.PageProps {}
}

export {};
