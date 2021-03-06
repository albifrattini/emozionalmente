import React, { Component } from 'react';
import { MdPlayArrow, MdPause } from 'react-icons/md';
import { FiThumbsDown, FiThumbsUp } from 'react-icons/fi';
import { GoArrowLeft, GoArrowRight } from 'react-icons/go';
import classes from './ListenButton.css';

class ListenButton extends Component {

    hoverColor = () => {
        if (this.props.isPlaying) {
            document.getElementById('pausebtn').style.color = 'white';
        } else {
            document.getElementById('playbtn').style.color = 'white';
        }
    }

    leaveColor = () => {
        if (this.props.isPlaying) {
            document.getElementById('pausebtn').style.color = 'var(--logo-violet)';
        } else {
            document.getElementById('playbtn').style.color = 'var(--logo-violet)';
        }
    }

    render () {

        let tooltip = classes.Tooltip;
        let playEffect = classes.Listen;
        let badReview = classes.ReviewCard;
        let goodReview = classes.ReviewCard;
        let goodStyle = {
            border: "2px solid transparent"
        };
        let badStyle = {
            border: "2px solid transparent"
        };

        // if (!this.props.showTooltip) {
        //     tooltip = [classes.Tooltip, classes.DisplayNone].join(' ');
        // }

        if (this.props.isPlaying) {
            playEffect = [classes.Listen, classes.Pulse].join(' ');
        }

        if (this.props.selected === "bad") {
            badReview = [classes.ReviewCard, classes.Highlight].join(' ');
            badStyle = {
                border: "2px solid var(--logo-red)"
            }
        } 
        if (this.props.selected === "good") {
            goodReview = [classes.ReviewCard, classes.Highlight].join(' ');
            goodStyle = {
                border: "2px solid var(--greener)"
            }
        }

        return (
            <div className={classes.Box}>
                <div className={badReview} style={badStyle} onClick={() => this.props.clickedreview('bad')}>
                    <FiThumbsDown size="28px" color="var(--logo-red)"/>
                    <span>{this.props.tdown}</span>
                    <span className={tooltip} dangerouslySetInnerHTML={{
                        __html: this.props.tdowntooltip
                    }}></span>
                    { 
                        this.props.showGuide && this.props.selected === '' ?
                            <GoArrowRight 
                                className={classes.LeftArrow}
                                size="32px"></GoArrowRight>
                            : 
                            null 
                    }
                </div>
                <button className={playEffect} onClick={this.props.clicked} >
                    { this.props.isPlaying ?
                        <MdPause id="pausebtn" size="56px" color="var(--logo-violet)"/>
                        :
                        <MdPlayArrow id="playbtn" size="56px" color="var(--logo-violet)"/>
                    }
                </button>
                <div className={goodReview} style={goodStyle} onClick={() => this.props.clickedreview('good')}>
                    <FiThumbsUp size="28px" color="var(--greener)"/>
                    <span>{this.props.tup}</span>
                    <span className={tooltip} dangerouslySetInnerHTML={{
                        __html: this.props.tuptooltip
                    }}></span>
                    { 
                        this.props.showGuide && this.props.selected === '' ?
                            <GoArrowLeft className={classes.RightArrow} size="32px"></GoArrowLeft>
                            : 
                            null 
                    }
                </div>
            </div>
        );    
    }
}

export default ListenButton;