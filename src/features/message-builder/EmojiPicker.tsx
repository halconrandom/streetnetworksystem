import { EmojiPicker as EmojiPickerType } from '@integrations/components-sdk';
import { Picker } from 'emoji-mart';

const notFound = () => (
    <div className="flex flex-col items-center py-4 text-sm text-gray-500">
        <span style={{
            width: 38, height: 38, display: 'inline-block',
            backgroundImage: 'url("https://cdn.discordapp.com/emojis/811160357682675792.png?size=64")',
            backgroundSize: 'contain',
        }} />
        <div className="mt-2 font-bold">No Emoji Found</div>
    </div>
);

export const EmojiPicker: EmojiPickerType = ({ onSelect }) => {
    return (
        <div className="emoji-picker">
            {/* @ts-ignore */}
            <Picker
                // @ts-ignore
                notFound={notFound}
                theme="dark"
                set="twitter"
                title="Pick your emoji…"
                perLine={8}
                color="#000"
                emoji="point_up"
                autoFocus
                emojiSize={24}
                defaultSkin={1}
                native={false}
                sheetSize={64}
                showPreview
                showSkinTones
                emojiTooltip={false}
                useButton
                enableFrequentEmojiSort={false}
                onSelect={(emoji: any) => {
                    if (emoji.custom === true) {
                        const [name, id] = emoji.short_names[0].split(':');
                        onSelect({ name, id });
                    } else {
                        onSelect({ name: emoji.native, id: null });
                    }
                }}
            />
        </div>
    );
};
