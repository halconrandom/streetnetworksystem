import { CodeBlock, dracula } from 'react-code-blocks';
import Styles from './App.module.css';
import Select, { Props } from 'react-select';
import { select_styles } from './Select';
import { libs } from '../libs.config';
import { Component } from '@integrations/components-sdk';
import { useTranslation } from 'react-i18next';
import ejs from 'ejs';
import type { OnChangeValue } from 'react-select';

const indent = (text: string, depth: number, skipFirst = false) => {
    const test = text.split('\n').map((line) => (line.length ? ' '.repeat(depth) : '') + line);
    if (skipFirst) {
        test[0] = test[0].trimStart();
    }
    return test.join('\n');
};

const requireContext = require as unknown as Require & {
    context(
        directory: string,
        useSubdirectories: boolean,
        regExp: RegExp
    ): {
        keys(): string[];
        (id: string): string;
    };
};
const context = requireContext.context('./codegen', true, /\.ejs$/);
const codegenModules: Record<string, string> = context.keys().reduce((acc, key) => {
    acc[key] = context(key) as string;
    return acc;
}, {} as Record<string, string>);

const compiledCache = new Map<string, ejs.TemplateFunction>();

const getTemplate = (name: string) => codegenModules[name];

const renderTemplate = (name: string, data: Record<string, unknown>) => {
    const template = getTemplate(name);
    if (!template) {
        throw new Error(`Component ${name} doesn't exist.`);
    }
    let compiled = compiledCache.get(name);
    if (!compiled) {
        compiled = ejs.compile(template, {
            client: true,
            strict: false,
            localsName: 'data',
            escape: (markup: string) => JSON.stringify(markup),
        });
        compiledCache.set(name, compiled);
    }

    const include = (includeName: string, includeData: Record<string, unknown>) =>
        renderTemplate(`./codegen${includeName}`, includeData);

    return (compiled as unknown as (payload: Record<string, unknown>) => string)({
        ...data,
        indent,
        include,
    });
};

const libComponents: { [name: string]: (data: Record<string, unknown>) => string } = {};

for (const key of Object.keys(codegenModules)) {
    const match = key.match(/^\.\/codegen\/([^/]+)\/main(?:\.[^/]*)?\.ejs$/);
    if (match) {
        const group = match[1];
        libComponents[group] = (data) => renderTemplate(key, data);
    }
}

type selectOption = {
    label: string;
    value: string;
}

export function Codegen({state, page, setPage} : {
    state: Component[],
    page: string,
    setPage: (page: string) => void
}) {

    // In this scope of code null === JSON, this may change in the future
    const libSelected = page === '200.home' ? 'json' : page;
    const {t} = useTranslation("website");
    const setLibSelected = (lib: string) => setPage(lib === 'json' ? '200.home' : lib);

    const selectOptions: selectOption[] = [
        {
            label: 'JSON',
            value: 'json',
        },
        ...Object.keys(libComponents).map((comp) => ({
            label: libs[comp]?.name || comp,
            value: comp,
        })),
    ];

    let data;
    let language = 'json';

    if (Object.keys(libComponents).includes(libSelected)) {
        const renderer = libComponents[libSelected];
        data = renderer({ components: state });
        language = libs[libSelected]?.language || 'json';
    } else {
        data = JSON.stringify(state, undefined, 4)
    }

    return (
        <>
            <p style={{marginBottom: '0.5rem', marginTop: '8rem'}}>{t('codegen.title')}</p>
            <Select
                styles={select_styles}
                options={selectOptions}
                isMulti={false}
                value={selectOptions.find((opt) => opt.value === libSelected)}
                onChange={((newValue: OnChangeValue<selectOption, false>) => {
                    if (newValue) setLibSelected(newValue.value);
                }) as Props['onChange']}
            />

            <div className={Styles.data}>
                <CodeBlock text={data} language={language} showLineNumbers={false} theme={dracula} />
            </div>
        </>
    );
}

