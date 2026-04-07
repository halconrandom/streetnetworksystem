import Styles from './Container.module.css';
import { CapsuleInner } from '../CapsuleInner';
import CapsuleStyles from '../Capsule.module.css';
import { ComponentsProps } from '../Capsule';
import { ContainerComponent } from '../utils/componentTypes';
import { DroppableID } from '../dnd/components';
import { useMemo } from 'react';
import { flattenErrorsWithoutComponents, hasErrorsWithoutComponents } from '../errors';
import { useTranslation } from 'react-i18next';

export function Container({
    state,
    stateKey,
    stateManager,
    passProps,
    errors
}: ComponentsProps & { state: ContainerComponent }) {
    const hasColor = state.accent_color != null;
    const colorHex =
        '#' +
        Number(state.accent_color || 0)
            .toString(16)
            .padStart(6, '0');
    const stateKeyComponents = useMemo(() => [...stateKey, 'components'], [...stateKey]);

    const hasErrors = errors ? hasErrorsWithoutComponents(errors) : false;
    const { t } = useTranslation('components-sdk');

    return (
        <div className={Styles.embed + ' ' + (state.spoiler ? Styles.spoiler : '')}>
            {hasColor && <div className={Styles.bar} style={{ backgroundColor: colorHex }} />}

            <CapsuleInner
                state={state?.components || []}
                stateKey={stateKeyComponents}
                stateManager={stateManager}
                showSectionButton={true}
                removeKeyParent={stateKey}
                buttonContext={'container'}
                droppableId={DroppableID.CONTAINER}
                // buttonClassName={CapsuleStyles.inline}
                passProps={passProps}
                errors={errors ? errors.components : null}
            />
            <div>
                {hasErrors && flattenErrorsWithoutComponents(errors!).map((error, i) => <div key={i} className={CapsuleStyles.error}><b>{t('error')}</b> {error}</div>)}
            </div>
        </div>
    );
}
