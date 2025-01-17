import WebpackError from 'webpack/lib/WebpackError.js';
import { callLocalizeCompiler } from './utils/call-localize-compiler.js';
import type { LocaleData } from './utils/load-locale-data.js';
import {
	reportModuleWarning,
	reportModuleError,
	onAssetPath,
} from './utils/webpack.js';
import {
	onLocaleUsage,
	onLocalizerCall,
	onStringKey,
} from './utils/on-localizer-call.js';
import { replaceLocaleInAssetName } from './utils/localize-filename.js';
import type {
	Options,
	LocalizeCompiler,
	WP5,
	NormalModuleFactory,
} from './types-internal.js';

export const handleSingleLocaleLocalization = (
	compilation: WP5.Compilation,
	normalModuleFactory: NormalModuleFactory,
	options: Options,
	locales: LocaleData,
	localizeCompiler: LocalizeCompiler,
	functionNames: string[],
	localeVariable: string,
	trackUsedKeys?: Set<string>,
) => {
	const [localeName] = locales.names;

	onLocalizerCall(
		normalModuleFactory,
		functionNames,
		localeVariable,
		onStringKey(
			locales,
			options,
			({ key, callNode, module }) => {
				trackUsedKeys?.delete(key);

				return callLocalizeCompiler(
					localizeCompiler,
					{
						callNode,
						resolveKey: (stringKey = key) => locales.data[localeName][stringKey],
						emitWarning: message => reportModuleWarning(
							module,
							new WebpackError(message),
						),
						emitError: message => reportModuleError(
							module,
							new WebpackError(message),
						),
					},
					localeName,
				);
			},
		),
		onLocaleUsage(
			locales,
			() => JSON.stringify(localeName),
		),
	);

	onAssetPath(
		compilation,
		replaceLocaleInAssetName(
			compilation,
			localeName,
		),
	);
};
