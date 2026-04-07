import { BetterInput as BetterInputType } from '@integrations/components-sdk';
import TextareaAutosize from 'react-textarea-autosize';

export const BetterInput: BetterInputType = ({ onChange, value }) => {
    return (
        <TextareaAutosize
            // @ts-ignore
            type="text"
            rows={1}
            maxLength={2000}
            onChange={onChange}
            value={value}
            className="w-full resize-none bg-[#fdfbf7] border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
    );
};
