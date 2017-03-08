/* @flow */

import React, { Component, PropTypes } from "react";

import TimeGroupingPopover from "metabase/query_builder/components/TimeGroupingPopover";
import PopoverWithTrigger from "metabase/components/PopoverWithTrigger";
import { SelectButton } from "metabase/components/Select";

import * as Query from "metabase/lib/query/query";
import * as Card from "metabase/meta/Card";

import { parseFieldBucketing, formatBucketing } from "metabase/lib/query_time";

type Props = {
};

export default class TimeseriesGroupingWidget extends Component {
    render () {
        const { card, setQueryFn, runQueryFn } = this.props;
        if (Card.isStructured(card)) {
            const query = Card.getQuery(card);
            const breakouts = Query.getBreakouts(query);

            return (
                <PopoverWithTrigger
                    triggerElement={<SelectButton hasValue>{formatBucketing(parseFieldBucketing(breakouts[0]))}</SelectButton>}
                    triggerClasses="my2"
                    ref={ref => this._popover = ref}
                >
                    <TimeGroupingPopover
                        className="text-brand"
                        field={breakouts[0]}
                        onFieldChange={(breakout) => {
                            Query.updateBreakout(card.dataset_query.query, 0, breakout);
                            setQueryFn(card.dataset_query);
                            runQueryFn();
                            this._popover.close();
                        }}
                    />
                </PopoverWithTrigger>
            )
        } else {
            return null;
        }
    }
}