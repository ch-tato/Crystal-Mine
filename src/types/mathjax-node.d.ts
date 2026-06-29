declare module 'mathjax-node' {
    interface Config {
        MathJax?: Record<string, unknown>;
    }

    interface TypesetOptions {
        math: string;
        format: 'TeX' | 'inline-TeX' | 'MathML';
        svg?: boolean;
        mml?: boolean;
        png?: boolean;
        html?: boolean;
    }

    interface TypesetResult {
        svg?: string;
        mml?: string;
        html?: string;
        errors?: string[];
        width?: string;
        height?: string;
    }

    function config(opts: Config): void;
    function start(): void;
    function typeset(opts: TypesetOptions): Promise<TypesetResult>;

    export default { config, start, typeset };
}
