import React from "react";
import Form from "../common/form";
import Joi from "joi-browser";
import { register } from "../../services/authService";

class SignUp extends Form {
  state = {
    submitPressed: false,
    data: {
      fullName: "",
      email: "",
      signUpPassword: "",
      confirmPassword: ""
    },
    errors: {}
  };

  schema = {
    fullName: Joi.string()
      .required()
      .label("Full Name"),
    email: Joi.string()
      .required()
      .label("Email"),
    signUpPassword: Joi.string()
      .required()
      .label("Password")
      .min(8),
    confirmPassword: Joi.valid(Joi.ref("signUpPassword"))
      .options({
        language: { any: { allowOnly: "must match password" } }
      })
      .label("Confirm Password")
  };

  doSubmit = async () => {
    let redirect = true;
    try {
      this.toggleSubmitFlag(this.state.submitPressed);
      const response = await register(this.state.data);
      localStorage.setItem("token", response.headers["x-auth"]);
    } catch (err) {
      if (err.response && err.response.status === 400) {
        const errors = { ...this.state.errors };
        errors.email = err.response.data.message;
        this.setState({ errors });
      }
      redirect = false;
    }
    this.toggleSubmitFlag(this.state.submitPressed);
    if (redirect) this.handleRedirect("/dashboard");
  };

  render() {
    return (
      <div className="container-fluid">
        <div className="form-row row">
          <div className="col-lg-3">
            <form onSubmit={this.handleSubmit} className="form sign-up">
              <h1 className="sign-up text-center">Sign Up</h1>
              {this.renderInput("fullName", "Full Name*")}
              {this.renderInput("email", "Email*", "email")}
              {this.renderInput("signUpPassword", "Password*", "password")}
              {this.renderInput(
                "confirmPassword",
                "Confirm Password*",
                "password"
              )}
              {this.renderButton(
                "SIGN UP",
                "sign-up",
                this.state.submitPressed
              )}
            </form>
          </div>
        </div>
      </div>
    );
  }
}

export default SignUp;
