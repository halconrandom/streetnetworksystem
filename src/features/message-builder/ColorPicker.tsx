import { ColorPicker as ColorPickerType } from '@integrations/components-sdk';
import { useState } from 'react';

const DISCORD_COLORS = [
    '#1abc9c', '#11806a', '#57F287', '#2ecc71', '#1f8b4c',
    '#3498db', '#206694', '#9b59b6', '#71368a', '#e91e63',
    '#ad1457', '#f1c40f', '#c27c0e', '#e67e22', '#a84300',
    '#ED4245', '#e74c3c', '#992d22', '#7289da', '#5865F2',
    '#99aab5', '#36393F', '#EB459E', '#FEE75C',
];

export const ColorPicker: ColorPickerType = ({ hexColor, onChange }) => {
    const [customColor, setCustomColor] = useState(hexColor || '#5865F2');

    const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const hex = e.target.value;
        setCustomColor(hex);
        onChange(parseInt(hex.replace('#', ''), 16));
    };

    return (
        <div className="bg-[#fdfbf7] border-2 border-black shadow-[4px_4px_0px_#000] p-3 w-56">
            <div className="grid grid-cols-6 gap-1 mb-3">
                {DISCORD_COLORS.map((color) => (
                    <button
                        key={color}
                        type="button"
                        title={color}
                        onClick={() => onChange(parseInt(color.replace('#', ''), 16))}
                        className="w-7 h-7 border-2 border-transparent hover:border-black transition-all"
                        style={{ backgroundColor: color }}
                    />
                ))}
            </div>
            <div className="flex items-center gap-2 border-t-2 border-black pt-2">
                <input
                    type="color"
                    value={customColor}
                    onChange={handleCustomChange}
                    className="w-8 h-8 border-2 border-black cursor-pointer bg-transparent"
                />
                <span className="text-xs font-mono font-bold">{customColor.toUpperCase()}</span>
            </div>
            <button
                type="button"
                onClick={() => onChange(null)}
                className="mt-2 w-full text-xs font-bold border-2 border-black py-1 hover:bg-black hover:text-[#fdfbf7] transition-colors"
            >
                Remove color
            </button>
        </div>
    );
};
