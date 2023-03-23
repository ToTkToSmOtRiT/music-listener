import instance from "./instance";

import songLoader from './load'

import authModule from "./auth";

export default{
    auth: authModule(instance),
    loader: songLoader(instance)
}