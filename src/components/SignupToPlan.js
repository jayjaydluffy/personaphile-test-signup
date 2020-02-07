import React, { Component } from 'react'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'

import './SignupToPlan.style.css'
import firebase from '../configs/firebase'

const plan = {
    egg: {},
    fledgingMonthly: {
        premiumIntent: {
            fulfilled: false,
            plan: "fledging",
            frequency: "monthly"
        }
    },
    fledgingYearly: {
        premiumIntent: {
            fulfilled: false,
            plan: "fledging",
            frequency: "yearly"
        }
    },
    flyingMonthly: {
        premiumIntent: {
            fulfilled: false,
            plan: "flying",
            frequency: "monthly"
        }
    },
    flyingYearly: {
        premiumIntent: {
            fulfilled: false,
            plan: "flying",
            frequency: "yearly"
        }
    },
}

class SignupToPlan extends Component {
    state = {
        plan: 'egg',
        email: '',
        error: null,
        success: null,
        sendingData: false,
    }
    
    checkEmailIsUsed = async email => {
        try {
            const auth = firebase.auth()
            const signInMethods = await auth.fetchSignInMethodsForEmail(email)
            return !!signInMethods.length
        } catch (error) {
            console.log(error)
            return true
        }
    }

    checkValidEmail = () => {
        const pattern = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
        return pattern.test(this.state.email)
    }

    doSendExistingEmail = async email => {
        try {
            const functions = firebase.functions()
            const sendExistingEmailSignup = functions.httpsCallable('sendExistingEmailSignup');
            await sendExistingEmailSignup({ 
                email,
                url: 'https://notlive.personaphile.com',
                ...plan[this.state.plan]
            })
            this.setState({
                success: 'You have successfully signed up! Please check your email.'
            }, () => this.resetForm())
        } catch (error) {
            this.handleErrorCatch(error)
        }
    }

    getReferrerCode = () => {
        let urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('rf');
    }

    handleAddContactToSignupList = async email => {
        try {
            const functions = firebase.functions()
            const addContactToSignupList = functions.httpsCallable('addContactToSignupList');
            await addContactToSignupList({ email })
        } catch (error) {
            this.handleErrorCatch(error)
        }
    }
    
    handleErrorCatch = error => {
        const code = error.code, message = error.message, details = error.details;
        this.setState({
            error: `There was an error processing the signup:\n\nError Code:
                ${code} \nError Message: ${message} \nError Details: ${details}. 
                \n Refresh the page and try again.`
        })
    }

    handleChangePlan = (e, input) => {
        this.setState({
            [input]: e.target.value,
            error: null,
            success: null
        })
    }

    handleOnSubmit = e => {
        e.preventDefault()
        if (this.checkValidEmail()) {
            this.setState({sendingData: true})
            this.handleSignup()
        } else {
            this.setState({
                error: 'Email is invalid!'
            })
        }
    }

    handleSendEmailSignup = async (email, regLink) => {
        try {
            const functions = firebase.functions()
            const sendEmailSignup = functions.httpsCallable('sendEmailSignup');
            await sendEmailSignup({ email, completeRegLink: regLink })
            await this.handleAddContactToSignupList(email);
            this.setState({
                success: 'You have successfully signed up! Please check your email.'
            }, () => this.resetForm())
        } catch (error) {
            this.handleErrorCatch(error)
        }
    }

    handleSignup = async () => {
        const email = this.state.email.toLowerCase()
        const emailTaken = await this.checkEmailIsUsed(email);

        if (emailTaken) {
            await this.doSendExistingEmail(email);
        } else {
            await this.handleSignupRegistration(email)
        }
    }

    handleSignupRegistration = async email => {
        try {
            const chosenPlan = this.state.plan
            let registrationData = {
                email,
                completed: false,
                createdAt: new Date(),
            }, 
            registrationPlan = chosenPlan === 'egg' ? { 
                referrerCode: this.getReferrerCode() 
            } : {
                referrerCode: this.getReferrerCode(),
                getStartedPlan: plan[chosenPlan].premiumIntent.plan,
                billFrequency: plan[chosenPlan].premiumIntent.frequency
            }

            const db = firebase.firestore()
            const registrationRef = db.collection("registrations");
            const queryRegistration = registrationRef.where("email", "==", email)
            const resultRegistration = await queryRegistration.get()

            if (resultRegistration.empty) {
                const registrationDoc = await registrationRef.add({...registrationData, ...registrationPlan})
                await this.handleSendEmailSignup(email, `https://notlive.personaphile.com/complete-registration/${registrationDoc.id}`);
            } else {
                const registrations = resultRegistration.docs;
                const registrationId = registrations[0].id;
                const updateRegistration = db.collection("registrations").doc(registrationId);
                await updateRegistration.update(registrationPlan)
                await this.handleSendEmailSignup(email, `https://notlive.personaphile.com/complete-registration/${registrationId}`);
            }
        } catch (error) {
            console.log(error);
            this.handleErrorCatch(error)
        }
    }

    resetForm = () => {
        this.setState({
            plan: 'egg',
            email: '',
            sendingData: false,
        })
    }

    render() {
        return (
            <Container>
                <Row>
                    <Col className="mx-auto my-5">
                        <h1 className="title">Test Personaphile Signups</h1>
                        { this.state.error ?
                            <Alert variant="danger">{this.state.error}</Alert> : null
                        }
                        { this.state.success ?
                            <Alert variant="success">{this.state.success}</Alert> : null
                        }
                        <Row>
                            <Col lg={6} className="mx-auto mt-4">
                                <Form onSubmit={this.handleOnSubmit} className="signup-form">
                                    <Form.Group>
                                        <Form.Label>Signup plan</Form.Label>
                                        <Form.Control as="select" onChange={e => this.handleChangePlan(e, 'plan')}>
                                            <option value="egg">Egg</option>
                                            <option value="fledgingMonthly">Fledging Monthly</option>
                                            <option value="fledgingYearly">Fledging Yearly</option>
                                            <option value="flyingMonthly">Flying Monthly</option>
                                            <option value="flyingYearly">Flying Yearly</option>
                                        </Form.Control>
                                    </Form.Group>
                                    <Form.Group>
                                        <Form.Label>Email</Form.Label>
                                        <Form.Control 
                                            value={this.state.email} 
                                            type="email" 
                                            placeholder="Enter email"
                                            onChange={e => this.handleChangePlan(e, 'email')}/>
                                    </Form.Group>
                                    <Button 
                                        disabled={this.state.sendingData} 
                                        type="submit" 
                                        variant="primary" 
                                        size="lg" 
                                        block
                                        className={this.state.sendingData ? 'show-spinner' : null}>
                                            <div className="spinner">
                                                <div className="bounce1"></div>
                                                <div className="bounce2"></div>
                                                <div className="bounce3"></div>
                                            </div>
                                            <div className="label">Signup now!</div>
                                    </Button>
                                </Form>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Container>
        )
    }
}

export default SignupToPlan
