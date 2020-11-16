// Copyright 2018 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Service for user data.
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { AppConstants } from 'app.constants';
import { UserInfo, UserInfoBackendDict } from 'domain/user/user-info.model';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowRef } from 'services/contextual/window-ref.service';

interface SubscriptionSummary {
  'creator_picture_data_url': string;
  'creator_username': string;
  'creator_impact': number;
}
interface PreferencesBackendDict {
  'preferred_language_codes': string;
  'preferred_site_language_code': string;
  'preferred_audio_language_code': string;
  'profile_picture_data_url': string;
  'default_dashboard': string;
  'user_bio': string;
  'subject_interests': string;
  'can_receive_email_updates': boolean;
  'can_receive_editor_role_email': boolean;
  'can_receive_feedback_message_email': boolean;
  'can_receive_subscription_email': boolean;
  'subscription_list': SubscriptionSummary[];
}
interface UrlBackendDict {
  'login_url': string;
}
interface UserContributionRightsDataBackendDict {
  'can_review_translation_for_language_codes': boolean;
  'can_review_voiceover_for_language_codes': boolean;
  'can_review_questions': boolean;
}


@Injectable({
  providedIn: 'root'
})
export class UserBackendApiService {
  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService,
    private urlService: UrlService,
    private windowRef: WindowRef
  ) {}

    private PREFERENCES_DATA_URL = '/preferenceshandler/data';
    private USER_CONTRIBUTION_RIGHTS_DATA_URL = '/usercontributionrightsdatahandler'; // eslint-disable-line max-len

    private userContributionRightsInfo = null;
    private userInfo = null;
    private returnUrl = '';

    getUserInfoAsync(): Promise<UserInfo> {
      return new Promise((resolve, reject) => {
        if (this.urlService.getPathname() === '/signup') {
          return resolve(UserInfo.createDefault());
        }
        if (this.userInfo) {
          return resolve(this.userInfo);
        }
        return this.http.get<UserInfoBackendDict>(
          '/userinfohandler').toPromise().then(
          (backendDict) => {
            if (backendDict.user_is_logged_in) {
              this.userInfo =
                UserInfo.createFromBackendDict(
                  backendDict);
              return resolve(this.userInfo);
            } else {
              return resolve(
                UserInfo.createDefault());
            }
          });
      });
    }
    getProfileImageDataUrlAsync(): Promise<string> {
      let profilePictureDataUrl = (
        this.urlInterpolationService.getStaticImageUrl(
          AppConstants.DEFAULT_PROFILE_IMAGE_PATH));
      return this.getUserInfoAsync().then(
        (userInfo) => {
          if (userInfo.isLoggedIn()) {
            return this.http.get<PreferencesBackendDict>(
              '/preferenceshandler/profile_picture'
            ).toPromise().then(
              (backendDict) => {
                if (backendDict.profile_picture_data_url) {
                  profilePictureDataUrl =
                    backendDict.profile_picture_data_url;
                }
                return profilePictureDataUrl;
              });
          } else {
            return new Promise((resolve, reject) => {
              resolve(profilePictureDataUrl);
            });
          }
        });
    }
    setProfileImageDataUrlAsync(
        newProfileImageDataUrl: string): Promise<PreferencesBackendDict> {
      const profileImageUpdateUrlData = {
        update_type: 'profile_picture_data_url',
        data: newProfileImageDataUrl
      };
      return this.http.put<PreferencesBackendDict>(
        this.PREFERENCES_DATA_URL, profileImageUpdateUrlData).toPromise();
    }
    getLoginUrlAsync(): Promise<string> {
      const urlParameters = {
        current_url: this.returnUrl ||
        this.windowRef.nativeWindow.location.pathname
      };
      return this.http.get<UrlBackendDict>(
        '/url_handler', { params: urlParameters }).toPromise().then(
        (backendDict) => {
          return backendDict.login_url;
        });
    }
    setReturnUrl(newReturnUrl: string): void {
      this.returnUrl = newReturnUrl;
    }
    getUserContributionRightsData():
      Promise<UserContributionRightsDataBackendDict> {
      return new Promise((resolve, reject) => {
        if (this.userContributionRightsInfo) {
          return resolve(this.userContributionRightsInfo);
        } else {
          return this.http.get<UserContributionRightsDataBackendDict>(
            this.USER_CONTRIBUTION_RIGHTS_DATA_URL).toPromise().then(
            (backendDict) => {
              this.userContributionRightsInfo = backendDict;
              return resolve(this.userContributionRightsInfo);
            });
        }
      });
    }
}

angular.module('oppia').factory(
  'UserBackendApiService',
  downgradeInjectable(UserBackendApiService));
