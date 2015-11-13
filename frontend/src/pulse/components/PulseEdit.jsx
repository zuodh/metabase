import React, { Component, PropTypes } from "react";

import PulseEditName from "./PulseEditName.jsx";
import PulseEditCards from "./PulseEditCards.jsx";
import PulseEditChannels from "./PulseEditChannels.jsx";

import ActionButton from "metabase/components/ActionButton.jsx";

import {
    setEditingPulse,
    updateEditingPulse,
    saveEditingPulse,
    deletePulse,
    fetchCards,
    fetchUsers,
    fetchPulseFormInput
} from "../actions";

import _ from "underscore";
import cx from "classnames";

export default class PulseEdit extends Component {
    constructor(props) {
        super(props);

        _.bindAll(this, "save", "delete", "setPulse");
    }

    static propTypes = {
        pulses: PropTypes.object,
        pulseId: PropTypes.number
    };

    componentDidMount() {
        this.props.dispatch(setEditingPulse(this.props.pulseId));
        this.props.dispatch(fetchCards());
        this.props.dispatch(fetchUsers());
        this.props.dispatch(fetchPulseFormInput());
    }

    async save() {
        await this.props.dispatch(saveEditingPulse());
        this.props.onChangeLocation("/pulse/"+this.props.pulse.id);
    }

    async delete() {
        await this.props.dispatch(deletePulse(this.props.pulse.id));
        this.props.onChangeLocation("/pulse");
    }

    setPulse(pulse) {
        this.props.dispatch(updateEditingPulse(pulse));
    }

    isValid() {
        let { pulse } = this.props;
        return pulse.name && pulse.cards.length && pulse.channels.length > 0 && pulse.channels.filter((c) => !this.channelIsValid(c)).length === 0;
    }

    channelIsValid(channel) {
        let channelSpec = this.props.formInput.channels && this.props.formInput.channels[channel.channel_type];
        if (!channelSpec) {
            return false;
        }
        switch (channel.schedule_type) {
            // these cases intentionally fall though
            case "weekly": if (channel.schedule_day == null) { return false };
            case "daily":  if (channel.schedule_hour == null) { return false };
            case "hourly": break;
            default:       return false;
        }
        if (channelSpec.recipients) {
            if (!channel.recipients || channel.recipients.length === 0) {
                return false;
            }
        }
        if (channelSpec.fields) {
            for (let field of channelSpec.fields) {
                if (field.required && (channel.details[field.name] == null || channel.details[field.name] == "")) {
                    return false;
                }
            }
        }
        return true;
    }

    render() {
        let { pulse } = this.props;
        return (
            <div className="PulseEdit">
                <div className="PulseEdit-header flex align-center border-bottom py3">
                    <h1>{pulse && pulse.id != null ? "Edit" : "New"} pulse</h1>
                    <a className="text-brand text-bold flex-align-right">What's a pulse?</a>
                </div>
                <div className="PulseEdit-content pt2">
                    <PulseEditName {...this.props} setPulse={this.setPulse} />
                    <PulseEditCards {...this.props} setPulse={this.setPulse} />
                    <PulseEditChannels {...this.props} setPulse={this.setPulse} />
                    { pulse && pulse.id != null &&
                        <div className="mb2">
                            <h2 className="text-error">Danger Zone</h2>
                            <div className="py2">
                                <ActionButton
                                    actionFn={() => confirm("Delete this pulse?") && this.delete()}
                                    className="Button Button--danger"
                                    normalText="Delete this Pulse"
                                    activeText="Deleting…"
                                    failedText="Delete failed"
                                    successText="Deleted"
                                />
                            </div>
                        </div>
                    }
                </div>
                <div className="PulseEdit-footer flex align-center border-top py3">
                    <ActionButton
                        actionFn={this.save}
                        className={cx("Button Button--primary", { "disabled": !this.isValid() })}
                        normalText={pulse.id != null ? "Save changes" : "Create pulse"}
                        activeText="Saving…"
                        failedText="Save failed"
                        successText="Saved"
                    />
                    <a className="text-bold flex-align-right no-decoration text-brand-hover" href="/pulse">Cancel</a>
                </div>
            </div>
        );
    }
}
