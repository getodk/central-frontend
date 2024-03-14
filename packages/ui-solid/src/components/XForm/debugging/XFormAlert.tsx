import { Alert, AlertTitle } from '@suid/material';
import type { AlertColor } from '@suid/material/Alert';
import type { JSX } from 'solid-js';
import { Show } from 'solid-js';

interface XFormAlertProps {
	readonly title?: JSX.Element;
	readonly children: JSX.Element;
	readonly detailsSummary?: JSX.Element;
	readonly severity: AlertColor;
}

export const XFormAlert = (props: XFormAlertProps) => {
	return (
		<Alert severity={props.severity}>
			<Show when={props.title} keyed={true}>
				{(title) => <AlertTitle>{title}</AlertTitle>}
			</Show>

			<details>
				<Show when={props.detailsSummary} keyed={true}>
					{(detailsSummary) => <summary>{detailsSummary}</summary>}
				</Show>

				{props.children}
			</details>
		</Alert>
	);
};
